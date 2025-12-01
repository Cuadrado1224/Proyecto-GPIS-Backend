import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },
  typeId: { type: DataTypes.BIGINT, allowNull: false, field: "type_id" },
  title: { type: DataTypes.TEXT, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  productId: { type: DataTypes.BIGINT, allowNull: true, field: "product_id" }, // Para notificaciones de productos
  reportId: { type: DataTypes.BIGINT, allowNull: true, field: "report_id" },   // Para notificaciones de reportes
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: "created_at" },
}, {
  tableName: "notifications",
  timestamps: false,
});

export default Notification;
