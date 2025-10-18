import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Conversation = sequelize.define("Conversation", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  productId: { type: DataTypes.BIGINT, allowNull: false, field: "product_id" },
  buyerId: { type: DataTypes.BIGINT, allowNull: false, field: "buyer_id" },
  sellerId: { type: DataTypes.BIGINT, allowNull: false, field: "seller_id" },
}, {
  tableName: "conversations",
  timestamps: false,
});

export default Conversation;
