import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Role = sequelize.define("Role", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  roleName: { type: DataTypes.STRING, allowNull: false, field: "role_name" },
}, {
  tableName: "roles",
  timestamps: false,
});

export default Role;
