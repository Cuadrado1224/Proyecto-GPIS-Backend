import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Appeals = sequelize.define("Appeals", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    dateAppeals:{ type: DataTypes.DATE, allowNull: false},
    description:{ type: DataTypes.TEXT, allowNull: false},
    incidenceId:{ type: DataTypes.BIGINT, allowNull: false, field: "incidenceId"},
   
},{
    tableName: "appeals",
    timestamps: false,
});
export default Appeals;

