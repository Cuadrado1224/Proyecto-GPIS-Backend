import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteMe,
  login,
  whoAmI,
  upload,
  updateAvatar,
  updatePasswordUser
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         dni:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         lastname:
 *           type: string
 *         phone:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         rating:
 *           type: number
 *         Roles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               roleName:
 *                 type: string
 *     UserRegister:
 *       type: object
 *       required:
 *         - dni
 *         - email
 *         - name
 *         - lastname
 *         - password
 *         - phone
 *         - roleId
 *       properties:
 *         dni:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         lastname:
 *           type: string
 *         password:
 *           type: string
 *         phone:
 *           type: string
 *         roleId:
 *           type: integer
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         lastname:
 *           type: string
 *         phone:
 *           type: string
 *         roleId:
 *           type: integer
 */

/**
 * @swagger
 * /users/:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", authenticateToken, getAllUsers);

/**
 * @swagger
 * /users/whoami:
 *   get:
 *     summary: Obtiene usuario actual basado en el token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 */
router.get("/whoami", authenticateToken, whoAmI);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Elimina la cuenta del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta eliminada correctamente
 *       401:
 *         description: No autenticado
 */
router.delete("/me", authenticateToken, deleteMe);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 */
router.get("/:id", authenticateToken, getUserById);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               dni:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               lastname:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Usuario registrado
 *       400:
 *         description: Email, DNI ya registrado o rol no válido
 */
router.post("/register", upload.single("avatar"), createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Usuario no encontrado o contraseña incorrecta
 */
router.post("/login", login);

/**
 * @swagger
 * /users/password:
 *   put:
 *     summary: Actualizar la contraseña de un usuario
 *     description: Permite al usuario actualizar su contraseña proporcionando la contraseña actual y una nueva.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Contraseña actual del usuario
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña
 *                 example: "abcDEF123!"
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario actualizado"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Contraseña incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar usuario
 */
router.put("/password",authenticateToken, updatePasswordUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualiza un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id", authenticateToken, updateUser);

/**
 * @swagger
 * /users/{id}/avatar:
 *   put:
 *     summary: Actualiza el avatar de un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar actualizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id/avatar", upload.single("avatar"), updateAvatar);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Elimina un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete("/:id", authenticateToken, deleteUser);




export default router;
