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
  updatePasswordUser,
  requestPasswordReset,
  resetPassword,
  resendVerification,
  verifyEmail,
  validateResetToken,
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
// import { verifyEmailPage, resetPasswordPage } from "../controllers/authPages.controller.js";

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
 *         ratingCount:
 *           type: integer
 *           description: Cantidad de calificaciones recibidas
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
 *         status:
 *           type: string
 *           example: "activo"
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
 *         status:
 *           type: string
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
 *               status:
 *                 type: string
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
 *       403:
 *         description: Cuenta no verificada
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
 * /users/resend-verification:
 *   post:
 *     summary: Reenviar correo de verificación
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@correo.com"
 *     responses:
 *       200:
 *         description: Correo de verificación reenviado (si aplica)
 *       400:
 *         description: Email requerido
 *       404:
 *         description: Usuario no encontrado
 */
router.post("/resend-verification", resendVerification);

/**
 * @swagger
 * /users/verify-email:
 *   get:
 *     summary: Verifica la cuenta mediante token
 *     description: Devuelve una página HTML indicando el resultado de la verificación.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML con resultado de verificación
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Token inválido o faltante
 *       404:
 *         description: Usuario no encontrado
 */
router.get("/verify-email", verifyEmail);

/**
 * @swagger
 * /users/request-password-reset:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@correo.com"
 *     responses:
 *       200:
 *         description: Si el correo existe, se envía un enlace de restablecimiento
 *       400:
 *         description: Email requerido
 */
router.post("/request-password-reset", requestPasswordReset);

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: "abcDEF123!"
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Token inválido o faltante
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /users/reset-password:
 *   get:
 *     summary: Validar token de restablecimiento (HTML)
 *     description: Devuelve una página HTML para confirmar el token y permitir restablecer contraseña desde el navegador.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Página HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Token inválido o faltante
 */
router.get("/reset-password", validateResetToken);

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
