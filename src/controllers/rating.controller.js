import sequelize from "../config/database.js";
import SellerRating from "../models/sellerRating.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

// Guardar rating desde mensaje de chat
export const submitRatingFromChat = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { conversationId, sellerId, score, comment } = req.body;
    const raterId = req.user.id; // El comprador

    // Validaciones
    if (!conversationId || !sellerId || !score) {
      await t.rollback();
      return res.status(400).json({ message: "Campos requeridos: conversationId, sellerId, score" });
    }

    // Validar que el score esté en rango
    const numericScore = parseFloat(score);
    if (numericScore < 1.0 || numericScore > 5.0) {
      await t.rollback();
      return res.status(400).json({ message: "Score debe estar entre 1.0 y 5.0" });
    }

    // Validar que no se califique a sí mismo
    if (sellerId === raterId) {
      await t.rollback();
      return res.status(400).json({ message: "No puedes calificarte a ti mismo" });
    }

    // Validar que el usuario sea realmente el comprador en esta conversación
    const conversation = await Conversation.findByPk(conversationId, { transaction: t });
    if (!conversation || conversation.buyerId !== raterId) {
      await t.rollback();
      return res.status(403).json({ message: "No tienes permiso para calificar en esta conversación" });
    }

    // Marcar el mensaje de rating como leído
    const ratingMessage = await Message.findOne({
      where: {
        conversationId,
        isRatingMessage: true
      },
      transaction: t
    });

    if (ratingMessage) {
      await ratingMessage.update({ read: true }, { transaction: t });
    }

    // Crear o actualizar la calificación (usar la lógica existente)
    let ratingRow = await SellerRating.findOne({ 
      where: { sellerId, raterId }, 
      transaction: t 
    });

    if (ratingRow) {
      await ratingRow.update({ score: numericScore, comment }, { transaction: t });
    } else {
      ratingRow = await SellerRating.create({ 
        sellerId, 
        raterId, 
        score: numericScore, 
        comment 
      }, { transaction: t });
    }

    // Recalcular promedio del vendedor
    const [aggUpsert] = await SellerRating.findAll({
      where: { sellerId },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("score")), "avg"],
        [sequelize.fn("COUNT", sequelize.col("id")), "cnt"],
      ],
      raw: true,
      transaction: t,
    });

    const avg = parseFloat(aggUpsert?.avg ?? 0) || 0;
    const cnt = parseInt(aggUpsert?.cnt ?? 0, 10) || 0;

    await User.update({ rating: avg, ratingCount: cnt }, { 
      where: { id: sellerId }, 
      transaction: t 
    });

    await t.commit();
    return res.json({ 
      message: "Calificación guardada desde chat", 
      rating: ratingRow, 
      sellerRating: { avg, count: cnt } 
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ 
      message: "Error guardando calificación", 
      error: error.message 
    });
  }
};

export const upsertSellerRating = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const sellerId = Number(req.params.sellerId);
    const raterId = req.user.id;
    const { score, comment } = req.body;

    if (!score || isNaN(score)) {
      await t.rollback();
      return res.status(400).json({ message: "Score requerido" });
    }
    const numericScore = parseFloat(score);
    if (numericScore < 1.0 || numericScore > 5.0) {
      await t.rollback();
      return res.status(400).json({ message: "Score debe estar entre 1.0 y 5.0" });
    }

    if (sellerId === raterId) {
      await t.rollback();
      return res.status(400).json({ message: "No puedes calificarte a ti mismo" });
    }

    const seller = await User.findByPk(sellerId, { transaction: t });
    if (!seller) {
      await t.rollback();
      return res.status(404).json({ message: "Vendedor no encontrado" });
    }

    let ratingRow = await SellerRating.findOne({ where: { sellerId, raterId }, transaction: t });
    if (ratingRow) {
      await ratingRow.update({ score: numericScore, comment }, { transaction: t });
    } else {
      ratingRow = await SellerRating.create({ sellerId, raterId, score: numericScore, comment }, { transaction: t });
    }

    const [aggUpsert] = await SellerRating.findAll({
      where: { sellerId },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("score")), "avg"],
        [sequelize.fn("COUNT", sequelize.col("id")), "cnt"],
      ],
      raw: true,
      transaction: t,
    });

    const avg = parseFloat(aggUpsert?.avg ?? 0) || 0;
    const cnt = parseInt(aggUpsert?.cnt ?? 0, 10) || 0;

    await User.update({ rating: avg, ratingCount: cnt }, { where: { id: sellerId }, transaction: t });

    await t.commit();
    return res.json({ message: "Calificación guardada", rating: ratingRow, sellerRating: { avg, count: cnt } });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: "Error guardando calificación", error: error.message });
  }
};

// Eliminar calificación
export const deleteSellerRating = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const sellerId = Number(req.params.sellerId);
    const raterId = req.user.id;

    const ratingRow = await SellerRating.findOne({ where: { sellerId, raterId }, transaction: t });
    if (!ratingRow) {
      await t.rollback();
      return res.status(404).json({ message: "Calificación no encontrada" });
    }

    await ratingRow.destroy({ transaction: t });

    // Recalcular
    const [aggDelete] = await SellerRating.findAll({
      where: { sellerId },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("score")), "avg"],
        [sequelize.fn("COUNT", sequelize.col("id")), "cnt"],
      ],
      raw: true,
      transaction: t,
    });

    const avg = parseFloat(aggDelete?.avg ?? 0) || 0;
    const cnt = parseInt(aggDelete?.cnt ?? 0, 10) || 0;

    await User.update({ rating: avg, ratingCount: cnt }, { where: { id: sellerId }, transaction: t });

    await t.commit();
    return res.json({ message: "Calificación eliminada", sellerRating: { avg, count: cnt } });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: "Error eliminando calificación", error: error.message });
  }
};
