import { Message, Conversation, Notification, NotificationType } from "../models/index.js";
import { emitNotificationToUsers } from "../utils/websocket-emitter.js";

// ===============================================
//                  VALIDACIONES
// ===============================================
const validateConversationAccess = async (conversationId, userId) => {
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    const error = new Error("Conversación no encontrada");
    error.status = 404;
    throw error;
  }

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    const error = new Error("No autorizado");
    error.status = 403;
    throw error;
  }

  return conversation;
};

// ===============================================
//                    METODOS
// ===============================================

// ===============================================
// Obtener todos los mensajes de una conversacion
// ===============================================
export const getAllMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.query;

    if (!conversationId)
      return res.status(400).json({ message: "conversationId requerido" });

    await validateConversationAccess(conversationId, userId);

    const messages = await Message.findAll({ where: { conversationId } });
    res.json(messages);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const getMessageById = async (req, res) => {}

// ===============================================
// Crear un mensaje dentro de la conversacion
// ===============================================
export const createMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, content } = req.body;

    if (!conversationId || !content)
      return res.status(400).json({ message: "conversationId y content requeridos" });

    const conversation = await validateConversationAccess(conversationId, userId);

    // Crear mensaje
    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
    });

    // Crear notificación para el otro usuario
    const receiverId =
      conversation.buyerId === userId
        ? conversation.sellerId
        : conversation.buyerId;

    let type = await NotificationType.findOne({ where: { typeName: "Mensaje" } });


    const notification = await Notification.create({
      userId: receiverId,
      typeId: type.id,
      title: "Nuevo mensaje",
      message: `Nuevo mensaje en el producto ${conversation.productId}`,
    });

    // Emitir notificación en tiempo real vía WebSocket
    emitNotificationToUsers(receiverId, notification.toJSON());

    res.status(201).json(message);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const updateMessage = async (req, res) => {};
export const deleteMessage = async (req, res) => {};