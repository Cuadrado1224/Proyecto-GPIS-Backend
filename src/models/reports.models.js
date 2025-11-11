import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";


const Reports = sequelize.define("Reports", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    dateReport:{ type: DataTypes.DATE, allowNull: false},
    typeReport:{  type: DataTypes.TEXT, allowNull: false},
    description:{ type: DataTypes.TEXT, allowNull: false},
    userId:{ type: DataTypes.BIGINT, allowNull: false, field: "userId"},
    productId:{ type: DataTypes.BIGINT, allowNull: false, field: "productId"},
},{tableName: "reports",
  timestamps: false,
});
export default Reports;
