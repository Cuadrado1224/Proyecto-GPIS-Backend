import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SellerRating = sequelize.define("SellerRating", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  sellerId: { type: DataTypes.BIGINT, allowNull: false },
  raterId: { type: DataTypes.BIGINT, allowNull: false },
  score: { type: DataTypes.DECIMAL(2,1), allowNull: false, validate: { min: 1.0, max: 5.0 } },
  comment: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: "seller_ratings",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["sellerId", "raterId"] }
  ]
});

export default SellerRating;
