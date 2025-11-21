import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Product from "../models/product.model.js";
import { Op } from "sequelize";

// ===============================================
// Obtener todas las conversaciones del Usuario
// ===============================================
export const getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where:{
        [Op.or]: [{buyerId: userId}, {sellerId: userId}]
      },
      order:[["id", "DESC"]]
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({message: "Error fetching conversations", error: error.message});
  }
};

// ===============================================
// Obtener una conversacion especifica
// ===============================================
export const getConversationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await validateConversation(req.params.id, userId);
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Error fetching conversation", error });
  }
};

// ===============================================
// Crear o reutiliza una conversacion
// ===============================================
export const createConversation = async (req, res) => {
  try {
    const userId = req.user.id; // Comprador
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ message: "productId requerido" });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const sellerId = product.sellerId;
    if (sellerId == userId) {
      return res.status(400).json({ message: "No puedes iniciar una conversación contigo mismo" });
    }   
    
    // Reutilizar si ya exister
    let conversation = await Conversation.findOne({ 
      where: { productId, 
        buyerId: userId,
      sellerId }
     });
     let isNewConversation = false;
     if (!conversation) {
      conversation = await Conversation.create({ productId, buyerId: userId, sellerId });
      isNewConversation = true;

      // Crear mensaje automático de rating para el comprador (solo en primera conversación)
      await Message.create({
        conversationId: conversation.id,
        senderId: sellerId, // Sistema (vendedor como "remitente" del mensaje)
        content: "rating_prompt", // Identificador especial
        read: false,
        isRatingMessage: true
      });
     }
     
     return res.status(201).json({
       ...conversation.toJSON(),
       isNewConversation,
       showRatingPrompt: isNewConversation
     });
  } catch (error) {
    res.status(500).json({ message: "Error creando conversación", error:error.message });
  }
};

// ===============================================
// Marcar mensajes como leídos en la conversación
// ===============================================
export const updateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { markRead } = req.body;
    const conversation = await validateConversation(req.params.id, userId);

    if (markRead) {
      await Message.update({read: true}, {
        where: {
          conversationId: conversation.id,
          // marcar como leídos los que NO envió el usuario actual
          senderId: conversation.buyerId == userId ? conversation.sellerId : conversation.buyerId
        }
      });
    }

    return res.json({ message: "Conversación actualizada" });
  } catch (error) {
    res.status(500).json({ message: "Error actualizando conversación", error });
  }
};

// ===============================================
// Eliminar una conversación
// ===============================================
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await validateConversation(req.params.id, userId);

    await Message.destroy({ where: {
      conversationId: conversation.id
    } });
    await conversation.destroy();
    return res.json({ message: "Conversación eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando conversación", error });
  }
};


// ===============================================
// Validador de conversación
// ===============================================
const validateConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findByPk(conversationId);

  // Si la conversación no existe
  if (!conversation) {
    const error = new Error("Conversación no encontrada");
    error.status = 404;
    throw error;
  }

  // Si el usuario no es el comprador ni el vendedor
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    const error = new Error("No autorizado");
    error.status = 403;
    throw error;
  }

  return conversation;
}
