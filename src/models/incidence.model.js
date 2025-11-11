import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Incidence =sequelize.define("Incidence",{
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    dateIncidence:{ type: DataTypes.DATE, allowNull: false},
    productId:{ type: DataTypes.BIGINT, allowNull: false, field: "productId"},
    moderatorId:{ type: DataTypes.BIGINT, allowNull: false, field:"userId"},
    status:{ type: DataTypes.ENUM("pending", "in_progress", "resolved"),defaultValue: "pending", allowNull: false},
    description:{ type: DataTypes.TEXT, allowNull: false},
},{
    tableName: "incidences",
    timestamps: false,
    
});
export default Incidence;