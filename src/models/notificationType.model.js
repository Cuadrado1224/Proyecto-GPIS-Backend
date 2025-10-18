import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const NotificationType = sequelize.define("NotificationType", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  typeName: { type: DataTypes.STRING, allowNull: false, field: "type_name" },
}, {
  tableName: "notification_types",
  timestamps: false,
});

export default NotificationType;
