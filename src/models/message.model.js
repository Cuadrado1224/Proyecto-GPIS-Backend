import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Message = sequelize.define("Message", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  conversationId: { type: DataTypes.BIGINT, allowNull: false, field: "conversation_id" },
  senderId: { type: DataTypes.BIGINT, allowNull: false, field: "sender_id" },
  content: { type: DataTypes.TEXT, allowNull: false },
  sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "sent_at" },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  isRatingMessage: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_rating_message" },
}, {
  tableName: "messages",
  timestamps: false,
});

export default Message;
