// src/sockets/realtime.js
import { verifyToken } from "../utils/jwt.js";
import {
  Message,
  Notification,
  Conversation,
  Product,
  ProductPhoto,
  User,
  NotificationType,
} from "../models/index.js";
import Sequelize from "sequelize";

/**
 * Controlador WebSocket principal
 */
export const metodos = async (ws, req, wss) => {
  // ====================== AUTENTICACIÓN ======================
  try {
    const token = req.query.token;
    if (!token) throw new Error("Token requerido");

    const decoded = verifyToken(token);
    ws.user = decoded; // Guardar usuario autenticado en el socket
    console.log(`Usuario conectado: ${ws.user.email}`);
  } catch (err) {
    console.error("Error autenticando WS:", err.message);
    ws.close();
    return;
  }

  const userId = ws.user.id;

  // ====================== CARGA INICIAL ======================
  try {
    // Notificaciones no leidas
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // Conversaciones del usuario (ultimo mensaje y producto asociado)
    const conversations = await Conversation.findAll({
      where: {
        [Sequelize.Op.or]: [{ sellerId: userId }, { buyerId: userId }],
      },
      include: [
        {
          model: Product,
          attributes: ["id", "title"],
          include: [
            {
              model: ProductPhoto,
              attributes: ["url"],
              limit: 1,
            },
          ],
        },
        {
          model: Message,
          limit: 1,
          order: [["sentAt", "DESC"]],
          include: [{ model: User, attributes: ["id", "name", "lastname"] }],
        },
      ],
    });

    // Enviar datos iniciales al conectar
    ws.send(
      JSON.stringify({
        type: "init:data",
        data: {
          notifications,
          conversations: conversations.map((conv) => ({
            conversationId: conv.id,
            product: {
              id: conv.Product.id,
              title: conv.Product.title,
              imageUrl: conv.Product.ProductPhotos?.[0]?.url || null,
            },
            lastMessage: conv.Messages?.[0]
              ? {
                  content: conv.Messages[0].content,
                  sender: `${conv.Messages[0].User.name} ${conv.Messages[0].User.lastname}`,
                  sentAt: conv.Messages[0].sentAt,
                }
              : null,
          })),
        },
      })
    );
  } catch (error) {
    console.error("Error al cargar datos iniciales:", error.message);
  }

  // ====================== EVENTOS DE CLIENTE ======================
  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log("Mensaje recibido:", data);

      switch (data.type) {
        case "chat:send":
          await handleChatMessage(ws, wss, data);
          break;

        case "notification:send":
          await handleNotification(ws, wss, data);
          break;

        case "chat:read":
          await markMessageAsRead(ws, wss, data.messageId);
          break;

        case "notification:read":
          await markNotificationAsRead(ws, wss, data.notificationId);
          break;

        default:
          console.warn("Tipo desconocido:", data.type);
      }
    } catch (error) {
      console.error("Error procesando mensaje WS:", error.message);
    }
  });

  ws.on("close", () => {
    console.log(`Usuario desconectado: ${ws.user?.email}`);
  });
};

// ====================== HANDLERS ======================

/**
 * Nuevo mensaje de chat
 */
const handleChatMessage = async (ws, wss, data) => {
  const { conversationId, content } = data;
  const senderId = ws.user.id;

  // Verificar conversación
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) {
    return ws.send(
      JSON.stringify({ type: "error", message: "Conversación no encontrada" })
    );
  }

  // Determinar receptor
  const receiverId =
    conversation.buyerId === senderId
      ? conversation.sellerId
      : conversation.buyerId;

  // Guardar mensaje
  const message = await Message.create({
    senderId,
    receiverId,
    conversationId,
    content,
    read: false,
  });

  // Crear notificacion
  const type = await NotificationType.findOne({
    where: { typeName: "Mensaje" },
  });

  const notification = await Notification.create({
    userId: receiverId,
    title: "Nuevo mensaje recibido",
    message: content.slice(0, 80),
    typeId: type?.id || null,
    read: false,
  });

  // Enviar en tiempo real al receptor
  wss.clients.forEach((client) => {
    if (client.user?.id === receiverId && client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: "chat:new",
          data: { message, notification },
        })
      );
    }
  });

  // Confirmar al emisor
  ws.send(JSON.stringify({ type: "chat:sent", data: { message } }));
};

/**
 * Enviar notificacion directa
 */
const handleNotification = async (ws, wss, data) => {
  const { userId,title, body, type } = data;
  const notification = await Notification.create({
    userId,
    title,
    message: body,
    typeId: type,
    read: false,
  });

  // Emitir a usuario si esta conectado
  wss.clients.forEach((client) => {
    if (client.user?.id === userId && client.readyState === 1) {
      client.send(
        JSON.stringify({ type: "notification:new", data: notification })
      );
    }
  });
};

/**
 * Marcar mensaje como leido y notificar a ambos usuarios
 */
const markMessageAsRead = async (ws, wss, messageId) => {
  const message = await Message.findByPk(messageId);
  if (!message) return;

  // Marcar el mensaje como leido
  await message.update({ read: true });
/*
  // Buscar notificacion relacionada y marcarla tambien
  const conversation=await Conversation.findOne({
    where:{id:message.conversationId}
  })
  const receiverId=conversation.buyerId===message.senderId?conversation.sellerId:conversation.buyerId;
  const notification = await Notification.findOne({
    where: {
      userId: receiverId,
      message: { [Sequelize.Op.like]: `%${message.content.slice(0, 50)}%` },
    },
  });

  if (notification) {
    await notification.update({ read: true });
  }
*/
  // Notificar a ambos usuarios (emisor y receptor)
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // Emisor => mostrar “leido”
      if (client.user?.id === message.senderId) {
        client.send(
          JSON.stringify({
            type: "chat:read:update",
            data: {
              messageId: message.id,
              conversationId: message.conversationId,
              readBy: "receiver",
              read: true,
            },
          })
        );
      }

      // Receptor => actualizar su estado local
      if (client.user?.id === message.receiverId) {
        client.send(
          JSON.stringify({
            type: "chat:read:update",
            data: {
              messageId: message.id,
              conversationId: message.conversationId,
              readBy: "self",
              read: true,
            },
          })
        );
      }
    }
  });

  console.log(`Mensaje ${messageId} marcado como leído`);
};

/**
 * Marcar notificacion como leida y actualizar en tiempo real
 */
const markNotificationAsRead = async (ws, wss, notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) return;

  await notification.update({ is_read: true });

  // Confirmacion al usuario actual
  ws.send(
    JSON.stringify({
      type: "notification:read:confirm",
      data: { notificationId },
    })
  );
};
