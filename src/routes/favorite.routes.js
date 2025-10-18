import { Router } from "express";
import {
  getAllFavorites,
  addFavorite,
  removeFavorite,
} from "../controllers/favorite.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *         productId:
 *           type: integer
 *         Product:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             price:
 *               type: number
 *             User:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 lastname:
 *                   type: string
 *     FavoriteCreate:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: integer
 */

/**
 * @swagger
 * /favorites/:
 *   get:
 *     summary: Lista los favoritos del usuario autenticado
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Favorite'
 */
router.get("/", authenticateToken, getAllFavorites);

/**
 * @swagger
 * /favorites/:
 *   post:
 *     summary: Agrega un producto a favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoriteCreate'
 *     responses:
 *       201:
 *         description: Producto agregado a favoritos
 *       400:
 *         description: Producto ya está en favoritos o datos inválidos
 *       404:
 *         description: Producto no encontrado
 */
router.post("/", authenticateToken, addFavorite);

/**
 * @swagger
 * /favorites/{productId}:
 *   delete:
 *     summary: Elimina un producto de favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto a eliminar de favoritos
 *     responses:
 *       200:
 *         description: Producto eliminado de favoritos
 *       404:
 *         description: Favorito no encontrado
 */
router.delete("/:productId", authenticateToken, removeFavorite);

export default router;