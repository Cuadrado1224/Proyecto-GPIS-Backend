import { User, Role, UserRole, Product, ProductPhoto } from "../models/index.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import sequelize from "../config/database.js";
import path from "path";
import multer from "multer";
import fs from "fs";

// Configuración de almacenamiento para avatares
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempPath = path.join("uploads", "tmp");
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    cb(null, tempPath);
  },
  filename: function (req, file, cb) {
    // archivo temporal se guarda con el dni
    cb(null, req.body.dni + path.extname(file.originalname));
  },
});



// Filtro de archivos (solo imágenes)
function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato no permitido. Solo JPG/PNG/WebP."), false);
  }
}
export const upload = multer({ storage, fileFilter });

// ===============================================
// Obtener todos los usuarios
// ===============================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, through: { attributes: [] } }]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// ===============================================
// Obtener usuario por ID
// ===============================================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role, through: { attributes: [] } }]
    });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// ===============================================
// Registrar usuario
// ===============================================
// ===============================================
// Registrar usuario
// ===============================================
export const register = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { dni, email, name, lastname, password, phone, roleId } = req.body;

    // Validaciones
    const userExists = await User.findOne({ where: { email }, transaction: t });
    if (userExists) {
      await t.rollback();
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Email ya registrado" });
    }

    const userDniExists = await User.findOne({ where: { dni }, transaction: t });
    if (userDniExists) {
      await t.rollback();
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "DNI ya registrado" });
    }

    const role = await Role.findByPk(roleId, { transaction: t });
    if (!role) {
      await t.rollback();
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Rol no válido" });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Procesar avatar si se subió
    let avatarUrl;
    if (req.file) {
      const userFolder = path.join("uploads", "users", String(dni));
      if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

      const finalPath = path.join(userFolder, dni + path.extname(req.file.originalname));

      // mover de tmp a la carpeta final
      fs.renameSync(req.file.path, finalPath);

      avatarUrl = `/${finalPath.replace(/\\/g, "/")}`;
    } else {
      // Usar imagen por defecto
      avatarUrl = "/uploads/common/user-common.png";
    }

    // Crear usuario
    const user = await User.create(
      { dni, email, name, lastname, passwordHash, phone, avatarUrl, rating: 0 },
      { transaction: t }
    );

    // Asignar rol
    await UserRole.create({ userId: user.id, roleId: role.id }, { transaction: t });

    await t.commit();

    const { passwordHash: _, ...safeUser } = user.toJSON();
    res.status(201).json({ message: "Usuario registrado", user: safeUser });
  } catch (error) {
    await t.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Error al registrar usuario", error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};


// ===============================================
// Login de usuario
// ===============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Contraseña incorrecta" });

    // Obtener roles
    const userRoles = await UserRole.findAll({
      where: { userId: user.id },
      include: [{ model: Role, as: "Role" }]
    });
    const roles = userRoles.map(ur => ur.Role.roleName);

    const token = generateToken({ id: user.id, email: user.email, roles });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error en login", error: error.message });
  }
};

// ===============================================
// Crear usuario (alias de register)
// ===============================================
export const createUser = async (req, res) => {
  return register(req, res);
};

// ===============================================
// Actualizar usuario
// ===============================================
export const updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, lastname, phone, avatarUrl, roleId } = req.body;
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await user.update({ name, lastname, phone, avatarUrl }, { transaction: t });

    // Cambiar rol si se envía
    if (roleId) {
      const role = await Role.findByPk(roleId, { transaction: t });
      if (!role) {
        await t.rollback();
        return res.status(400).json({ message: "Rol no válido" });
      }

      await UserRole.destroy({ where: { userId: user.id }, transaction: t });
      await UserRole.create({ userId: user.id, roleId: role.id }, { transaction: t });
    }

    await t.commit();
    res.json({ message: "Usuario actualizado", user });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
  }
};

// ===============================================
// Actualizar Contraseña usuario
// ===============================================
export const updatePasswordUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findOne({ where: { id: userId }, transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    // Verificar contraseña actual
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Contraseña incorrecta" });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ passwordHash }, { transaction: t });


    await t.commit();
    res.json({ message: "Usuario actualizado", user });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
  }
};

export const updateAvatar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const dni = user.dni; // usamos el dni del usuario ya creado

    // Procesar avatar
    let avatarUrl = user.avatarUrl;
    if (req.file) {
      const userFolder = path.join("uploads", "users", String(dni));
      if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

      const finalPath = path.join(userFolder, dni + path.extname(req.file.originalname));

      // Mover archivo desde tmp
      fs.renameSync(req.file.path, finalPath);

      avatarUrl = `/${finalPath.replace(/\\/g, "/")}`;
    }

    // Actualizar usuario
    await user.update({ avatarUrl }, { transaction: t });

    await t.commit();
    res.json({ message: "Avatar actualizado", avatarUrl });
  } catch (error) {
    await t.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Error al actualizar avatar", error: error.message });
  } finally {
    // limpieza extra por si quedó algo en tmp
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};

// ===============================================
// Eliminar usuario
// ===============================================
export const deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const dni = user.dni;

    // 1. Borrar carpeta de avatar
    const userFolder = path.join("uploads", "users", String(dni));
    if (fs.existsSync(userFolder)) {
      fs.rmSync(userFolder, { recursive: true, force: true });
    }

    // 2. Buscar productos asociados
    const products = await Product.findAll({ where: { sellerId: user.id }, transaction: t });

    for (const product of products) {
      // 2.1 Eliminar fotos en DB
      await ProductPhoto.destroy({ where: { productId: product.id }, transaction: t });

      // 2.2 Eliminar carpeta de fotos físicas
      const productFolder = path.join("uploads", "products", String(product.id));
      if (fs.existsSync(productFolder)) {
        fs.rmSync(productFolder, { recursive: true, force: true });
      }

      // 2.3 Eliminar producto
      await product.destroy({ transaction: t });
    }

    // 3. Eliminar roles y usuario
    await UserRole.destroy({ where: { userId: user.id }, transaction: t });
    await user.destroy({ transaction: t });

    await t.commit();
    res.json({ message: "Usuario y sus recursos asociados eliminados" });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
  }
};

// ===============================================
// Cambiar rol de usuario
// ===============================================
export const changeUserRole = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { roleName } = req.body;
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const role = await Role.findOne({ where: { roleName }, transaction: t });
    if (!role) {
      await t.rollback();
      return res.status(400).json({ message: "Rol no válido" });
    }

    await UserRole.destroy({ where: { userId: user.id }, transaction: t });
    await UserRole.create({ userId: user.id, roleId: role.id }, { transaction: t });

    await t.commit();
    res.json({ message: "Rol cambiado", userId: user.id, nuevoRol: roleName });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Error al cambiar rol", error: error.message });
  }
};

// ===============================================
// WhoAmI (usuario autenticado desde JWT)
// ===============================================
export const whoAmI = async (req, res) => {
  try {
    const userId = req.user.id; // viene del JWT
    const user = await User.findByPk(userId, { include: [Role] });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// ===============================================
// Eliminar (por token) reutilizo deleteUser
// ===============================================
export const deleteMe = async (req, res) => {
  try {
    req.params.id = String(req.user.id);
    return deleteUser(req, res);
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar mi cuenta", error: error.message });
  }
};
