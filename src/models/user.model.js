import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  dni: { type: DataTypes.STRING, allowNull: false, field: "dni" },
  email: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  lastname: { type: DataTypes.STRING, allowNull: false},
  passwordHash: { type: DataTypes.STRING, allowNull: false, field: "password_hash" },
  phone: { type: DataTypes.STRING, allowNull: false },
  avatarUrl: { type: DataTypes.TEXT, allowNull: false, field: "avatar_url" },
  rating: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName: "users",
  timestamps: false,
});

export default User;
