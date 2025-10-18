import app from "./src/app.js";
import { sequelize } from "./src/models/index.js";
import cors from "cors";
import { seedData } from "./src/config/seed.js";

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos");

    await sequelize.sync({ alter: true });
    console.log("✅ Tablas sincronizadas");

    await seedData(); // <-- insertar datos iniciales

    app.use(cors({
      origin: "*", 
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }));

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar:", error);
  }
})();
