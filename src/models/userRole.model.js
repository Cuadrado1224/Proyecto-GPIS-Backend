import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UserRole = sequelize.define("UserRole", {
  userId: { type: DataTypes.BIGINT, primaryKey: true, field: "user_id" },
  roleId: { type: DataTypes.BIGINT, primaryKey: true, field: "role_id" },
}, {
  tableName: "user_roles",
  timestamps: false,
});

export default UserRole; 
