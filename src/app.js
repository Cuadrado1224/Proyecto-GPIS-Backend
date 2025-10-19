import express from "express";
import cors from "cors";
import path from "path";
import morgan from "morgan";

import userRoutes from "./routes/user.routes.js";
import roleRoutes from "./routes/role.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";

// Corregido el nombre del archivo (singular en lugar de plural)
import incidenceRoutes from "./routes/incidence.routes.js";
import appealRoutes from "./routes/appeal.routes.js"; 
import reportsRoutes from "./routes/reports.routes.js";

import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import { authenticateToken } from "./middlewares/auth.middleware.js";
import expressWs from "express-ws";
import { metodos } from "./sockets/sockets.js";

const app = express();
const wsInstance = expressWs(app);

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Rutas
app.use("/users", userRoutes);
app.use("/roles", authenticateToken, roleRoutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/conversations", authenticateToken, conversationRoutes);
app.use("/messages", authenticateToken, messageRoutes);
app.use("/notifications", authenticateToken, notificationRoutes);
app.use("/favorites", authenticateToken, favoriteRoutes);

// También corregido aquí
app.use("/incidences", authenticateToken, incidenceRoutes);
app.use("/appeals", authenticateToken, appealRoutes);
app.use("/reports", authenticateToken, reportsRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/uploads", express.static("uploads"));

app.ws("/", (ws, req) => metodos(ws, req, wsInstance.getWss()));

export default app;