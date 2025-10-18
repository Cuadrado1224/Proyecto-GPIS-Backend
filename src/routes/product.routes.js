import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  uploadProductPhotos
} from "../controllers/product.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: API para gestión de productos
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener todos los productos
 *     description: Recupera una lista con todos los productos disponibles en el sistema.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos recuperada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error al recuperar productos
 *   post:
 *     summary: Crear un nuevo producto con fotos
 *     description: Crea un nuevo producto asociado a un vendedor, permitiendo subir múltiples imágenes.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ProductInput'
 *               - type: object
 *                 properties:
 *                   locationCoords:
 *                     $ref: '#/components/schemas/LocationCoords'
 *                   photos:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Categoría o vendedor no encontrado
 *       500:
 *         description: Error al crear producto
 */
router.get("/", getAllProducts);
router.post("/",authenticateToken, uploadProductPhotos.array("photos", 10), createProduct);

/**
 * @swagger
 * /products/my:
 *   get:
 *     summary: Obtener los productos del usuario autenticado
 *     description: Devuelve los productos creados por el usuario autenticado.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error al recuperar productos
 */
router.get("/my",authenticateToken, getMyProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     description: Devuelve un producto específico basado en su ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *   put:
 *     summary: Actualizar un producto y opcionalmente reemplazar sus fotos
 *     description: Permite actualizar los datos de un producto existente y subir nuevas imágenes.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ProductInput'
 *               - type: object
 *                 properties:
 *                   photos:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Categoría no válida
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al actualizar producto
 *   delete:
 *     summary: Eliminar un producto
 *     description: Elimina un producto del sistema basado en su ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al eliminar producto
 */
router.get("/:id", getProductById);
router.put("/:id",authenticateToken, uploadProductPhotos.array("photos", 10), updateProduct);
router.delete("/:id",authenticateToken, deleteProduct);

/**
 * @swagger
 * /products/{id}/status:
 *   patch:
 *     summary: Actualizar el estado de un producto
 *     description: Cambia el estado de un producto existente (por ejemplo, activo, vendido, reservado, inactivo).
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, sold, inactive, reserved]
 *                 example: sold
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Status no válido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al actualizar el estado
 */
router.patch("/:id/status",authenticateToken, updateProductStatus);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         sellerId:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *         locationCoords:
 *           $ref: '#/components/schemas/LocationCoords'
 *         price:
 *           type: number
 *           format: float
 *         categoryId:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [active, sold, inactive, reserved]
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *             description: URL de la foto del producto
 *       example:
 *         id: 1
 *         sellerId: 10
 *         title: "Bicicleta de montaña"
 *         description: "Bicicleta en excelente estado, casi nueva"
 *         location: "Santiago, Chile"
 *         locationCoords:
 *           lat: -33.4489
 *           lng: -70.6693
 *         price: 250.5
 *         categoryId: 3
 *         status: active
 *         photos:
 *           - "https://example.com/foto1.jpg"
 *           - "https://example.com/foto2.jpg"
 *
 *     ProductInput:
 *       type: object
 *       required:
 *         - sellerId
 *         - title
 *         - description
 *         - price
 *         - categoryId
 *       properties:
 *         sellerId:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *         locationCoords:
 *           $ref: '#/components/schemas/LocationCoords'
 *         price:
 *           type: number
 *           format: float
 *         categoryId:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [active, sold, inactive, reserved]
 *       example:
 *         sellerId: 10
 *         title: "Bicicleta de montaña"
 *         description: "Bicicleta en excelente estado, casi nueva"
 *         location: "Santiago, Chile"
 *         locationCoords:
 *           lat: -33.4489
 *           lng: -70.6693
 *         price: 250.5
 *         categoryId: 3
 *         status: active
 *
 *     LocationCoords:
 *       type: object
 *       required:
 *         - lat
 *         - lng
 *       properties:
 *         lat:
 *           type: number
 *           format: float
 *         lng:
 *           type: number
 *           format: float
 *       additionalProperties: false
 *       example:
 *         lat: -33.4489
 *         lng: -70.6693
 */
