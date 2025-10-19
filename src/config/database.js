import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
     port: Number(process.env.DB_PORT || (process.env.DB_DIALECT === "postgres" ? 5432 : undefined)),
    dialect: process.env.DB_DIALECT,
    logging: false, // quita logs SQL en consola
  }
);

export default sequelize;
