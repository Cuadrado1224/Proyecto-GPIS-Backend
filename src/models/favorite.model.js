import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Favorite = sequelize.define("Favorite", {
  userId: { type: DataTypes.BIGINT, primaryKey: true, field: "user_id" },
  productId: { type: DataTypes.BIGINT, primaryKey: true, field: "product_id" },
}, {
  tableName: "favorites",
  timestamps: false,
});

export default Favorite;
