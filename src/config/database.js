import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const {
  DATABASE_URL,
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST = "localhost",
  DB_DIALECT = "postgres",
  DB_PORT,
  DB_SSL = "false",
} = process.env;

// Activar SSL si: DB_SSL=true, DATABASE_URL contiene sslmode=require, o el host es de Neon
const isNeonHost = DB_HOST && DB_HOST.includes('neon.tech');
const requireSSL = DB_SSL === "true" || isNeonHost || (DATABASE_URL && /sslmode=require/i.test(DATABASE_URL));

let sequelize;

if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: DB_DIALECT,
    logging: false,
    dialectOptions: requireSSL
      ? {
          ssl: {
            require: true,
            // Neon y otros providers usan certificados autofirmados; evita fallos de verificación.
            rejectUnauthorized: false,
          },
        }
      : {},
  });
} else {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : (DB_DIALECT === "postgres" ? 5432 : undefined),
    dialect: DB_DIALECT,
    logging: false,
    dialectOptions: requireSSL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  });
}

export default sequelize;