import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProductPhoto = sequelize.define("ProductPhoto", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  productId: { type: DataTypes.BIGINT, allowNull: false, field: "product_id" },
  url: { type: DataTypes.TEXT, allowNull: false, field: "photo_url" },
  position: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "product_photos",
  timestamps: false,
});

export default ProductPhoto;
