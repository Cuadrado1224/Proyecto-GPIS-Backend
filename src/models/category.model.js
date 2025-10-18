import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Category = sequelize.define("Category", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  parentCategoryId: { type: DataTypes.BIGINT, allowNull: true, field: "parent_category_id" },
}, {
  tableName: "categories",
  timestamps: false,
});

export default Category;
