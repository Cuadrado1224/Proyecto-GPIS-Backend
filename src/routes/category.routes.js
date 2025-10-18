import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  getMainCategories,
  getSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API para gestión de categorías y subcategorías
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías recuperada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error al buscar categorías
 *   post:
 *     summary: Crear una nueva categoría
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Datos inválidos o categoría ya existente
 *       500:
 *         description: Error al crear categoría
 */
router.get("/", getAllCategories);
router.post("/",authenticateToken, createCategory);


/**
 * @swagger
 * /categories/main:
 *   get:
 *     summary: Obtener categorías principales (sin categoría padre) con subcategorías
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías principales con subcategorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error al recuperar categorías principales
 */
router.get("/main", getMainCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error al buscar categoría
 *   put:
 *     summary: Actualizar una categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       400:
 *         description: Categoría padre inválida o conflicto
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error al actualizar categoría
 *   delete:
 *     summary: Eliminar una categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *       400:
 *         description: No se puede eliminar una categoría con subcategorías
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error al eliminar categoría
 */
router.get("/:id", getCategoryById);
router.put("/:id",authenticateToken, updateCategory);
router.delete("/:id",authenticateToken, deleteCategory);

/**
 * @swagger
 * /categories/{parentId}/subcategories:
 *   get:
 *     summary: Obtener subcategorías de una categoría padre
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de subcategorías recuperada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error al recuperar subcategorías
 */

router.get("/:parentId/subcategories", getSubcategories);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         parentCategoryId:
 *           type: integer
 *           nullable: true
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         parentCategoryId:
 *           type: integer
 *           nullable: true
 */