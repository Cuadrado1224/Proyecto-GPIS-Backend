import { User, Role, UserRole, Product, ProductPhoto } from "../models/index.js";
import bcrypt from "bcryptjs";
import { generateToken, generateVerificationToken, verifyVerificationToken, generatePasswordResetToken, verifyPasswordResetToken } from "../utils/jwt.js";
import sequelize from "../config/database.js";
import path from "path";
import multer from "multer";
import fs from "fs";
import { enviarCorreo, sendVerificationEmail, sendPasswordResetEmail } from "../utils/emails.js";

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
export const register = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { dni, email, name, lastname, password, phone, roleId, status } = req.body;

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
      return res.status(400).json({ message: "Cedula ya registrada" });
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
      { dni, email, name, lastname, passwordHash, phone, avatarUrl, rating: 0, verified: false },
      { transaction: t }
    );

    // Asignar rol
    await UserRole.create({ userId: user.id, roleId: role.id }, { transaction: t });

    await t.commit();

    // Enviar correo de verificación (no interrumpe la respuesta si falla)
    try {
      const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
      const token = generateVerificationToken(email);
      const link = `${baseUrl}/users/verify-email?token=${encodeURIComponent(token)}`;
      await sendVerificationEmail({ to: email, link, name });
    } catch (e) {
      console.error("No se pudo enviar correo de verificación:", e.message);
    }

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
// ...existing code...

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

    if (!user.verified) {
      return res.status(403).json({
        message: "Cuenta no verificada. Revisa tu correo para verificarla o solicita un reenvío.",
        code: "UNVERIFIED_ACCOUNT"
      });
    }

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
    const { name, lastname, phone, avatarUrl, roleId, status } = req.body;
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

  await user.update({ name, lastname, phone, avatarUrl, status }, { transaction: t });

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

    const dni = user.dni; 

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

// ===============================================
// Solicitar restablecimiento de contraseña
// ===============================================
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requerido" });

    const user = await User.findOne({ where: { email } });

    // Responder genéricamente para no filtrar usuarios
    if (!user) {
      return res.json({ message: "Si el correo existe, se envió un enlace de restablecimiento" });
    }

    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const token = generatePasswordResetToken(email);
    const link = `${baseUrl}/users/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: email, link, name: user.name });

    return res.json({ message: "Si el correo existe, se envió un enlace de restablecimiento" });
  } catch (error) {
    return res.status(500).json({ message: "Error solicitando restablecimiento", error: error.message });
  }
};

// ===============================================
// Restablecer contraseña con token
// ===============================================
export const resetPassword = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      await t.rollback();
      return res.status(400).json({ message: "Token y nueva contraseña requeridos" });
    }

    const payload = verifyPasswordResetToken(token);
    if (payload.type !== "reset") {
      await t.rollback();
      return res.status(400).json({ message: "Token inválido" });
    }

    const user = await User.findOne({ where: { email: payload.email }, transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ passwordHash }, { transaction: t });

    await t.commit();
    return res.json({ message: "Contraseña restablecida" });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({ message: "Token inválido o expirado", error: error.message });
  }
};

// ===============================================
// Validar token de restablecimiento (GET)
// ===============================================
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400).type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Restablecer contraseña — Token requerido</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280;--ok:#16a34a;--err:#dc2626}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .muted{color:var(--muted)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>🔒 Restablecer contraseña</h2></div>
    <div class="content">
      <h3>Token requerido</h3>
      <p class="muted">Falta el token para restablecer la contraseña.</p>
    </div>
  </div>
</body></html>`);
      return;
    }

    const payload = verifyPasswordResetToken(token);
    if (payload.type !== "reset") {
      res.status(400).type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Restablecer contraseña — Token inválido</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280;--err:#dc2626}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .muted{color:var(--muted)}
  .err{color:var(--err)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>🔒 Restablecer contraseña</h2></div>
    <div class="content">
      <h3 class="err">Token inválido</h3>
      <p class="muted">El token no es válido.</p>
    </div>
  </div>
</body></html>`);
      return;
    }

    const email = payload.email;

    res.type('html').send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Restablecer contraseña</title>
  <style>
    :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280;--ok:#16a34a;--err:#dc2626}
    *{box-sizing:border-box} html,body{height:100%}
    body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
    .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
    .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
    .header h2{margin:0;font-size:18px;font-weight:800}
    .content{padding:20px}
    .account{margin:0 0 12px;color:var(--muted);font-size:14px}
    label{display:block;margin:12px 0 6px;font-weight:600;font-size:14px;color:#374151}
    input{width:100%;padding:12px;border:1px solid #d1d5db;border-radius:10px;outline:none;transition:box-shadow .2s,border-color .2s}
    input:focus{border-color:var(--primary);box-shadow:0 0 0 4px rgba(239,200,139,.35)}
    .actions{display:flex;justify-content:flex-end;margin-top:16px}
    button{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;border:0;padding:10px 14px;border-radius:10px;cursor:pointer;font-weight:700}
    button:disabled{opacity:.6;cursor:not-allowed}
    .msg{margin-top:12px;font-size:14px}
    .ok{color:var(--ok);background:#f0fdf4;border:1px solid #dcfce7;padding:10px;border-radius:10px}
    .err{color:var(--err);background:#fef2f2;border:1px solid #fee2e2;padding:10px;border-radius:10px}
  </style>
  <script>
    async function onSubmit(e){
      e.preventDefault();
      const btn = document.getElementById('submitBtn'); btn.disabled = true;
      const pw = document.getElementById('pw').value;
      const pw2 = document.getElementById('pw2').value;
      const token = document.getElementById('token').value;
      const msg = document.getElementById('msg');
      msg.textContent = ''; msg.className = 'msg';
      if(!pw || pw.length < 6){ msg.textContent = 'La contraseña debe tener al menos 6 caracteres.'; msg.classList.add('err'); btn.disabled = false; return; }
      if(pw !== pw2){ msg.textContent = 'Las contraseñas no coinciden.'; msg.classList.add('err'); btn.disabled = false; return; }
      try{
        const res = await fetch('/users/reset-password', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ token, newPassword: pw }) });
        const data = await res.json().catch(()=>({}));
        if(res.ok){ msg.textContent = 'Contraseña restablecida. Ya puedes cerrar esta ventana.'; msg.classList.add('ok'); document.getElementById('form').reset(); }
        else { msg.textContent = data.message || 'Error al restablecer la contraseña.'; msg.classList.add('err'); }
      }catch(err){ msg.textContent = 'Error de red. Intenta nuevamente.'; msg.classList.add('err'); }
      finally { btn.disabled = false; }
    }
  </script>
</head>
<body>
  <div class="card">
    <div class="header"><h2>🔒 Restablecer contraseña</h2></div>
    <div class="content">
      <p class="account">Cuenta: <strong>${email}</strong></p>
      <form id="form" onsubmit="onSubmit(event)">
        <input type="hidden" id="token" name="token" value="${token}" />
        <label for="pw">Nueva contraseña</label>
        <input id="pw" name="pw" type="password" placeholder="Nueva contraseña" required />
        <label for="pw2">Confirmar contraseña</label>
        <input id="pw2" name="pw2" type="password" placeholder="Confirmar contraseña" required />
        <div class="actions">
          <button id="submitBtn" type="submit">Guardar contraseña</button>
        </div>
        <div id="msg" class="msg" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</body>
</html>`);
  } catch (error) {
    return res.status(400).type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Restablecer contraseña — Token inválido o expirado</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280;--err:#dc2626}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .muted{color:var(--muted)}
  .err{color:var(--err)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>🔒 Restablecer contraseña</h2></div>
    <div class="content">
      <h3 class="err">Token inválido o expirado</h3>
      <p class="muted">${error.message}</p>
    </div>
  </div>
</body></html>`);
  }
};

// ===============================================
// Verificar email con token
// ===============================================
export const verifyEmail = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { token } = req.query;
    if (!token) {
      await t.rollback();
      res.status(400).type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Verificación — Token requerido</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .muted{color:var(--muted)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>📧 Verificación de cuenta</h2></div>
    <div class="content">
      <h3>Token requerido</h3>
      <p class="muted">Falta el token de verificación.</p>
    </div>
  </div>
</body></html>`);
      return;
    }

    const payload = verifyVerificationToken(token);
    if (payload.type !== "verify") {
      await t.rollback();
      res.status(400).type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Verificación — Token inválido</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280;--err:#dc2626}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .muted{color:var(--muted)}
  .err{color:var(--err)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>📧 Verificación de cuenta</h2></div>
    <div class="content">
      <h3 class="err">Token inválido</h3>
      <p class="muted">El token de verificación no es válido.</p>
    </div>
  </div>
</body></html>`);
      return;
    }

    const user = await User.findOne({ where: { email: payload.email }, transaction: t });
    if (!user) {
      await t.rollback();
      res.status(404).type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Verificación — Usuario no encontrado</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .muted{color:var(--muted)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>📧 Verificación de cuenta</h2></div>
    <div class="content">
      <h3>Usuario no encontrado</h3>
      <p class="muted">No pudimos ubicar tu cuenta.</p>
    </div>
  </div>
</body></html>`);
      return;
    }

    if (!user.verified) {
      await user.update({ verified: true }, { transaction: t });
    }
    await t.commit();

    res.type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cuenta verificada</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--ok:#16a34a;--muted:#6b7280}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .ok{color:var(--ok)}
  .muted{color:var(--muted)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>🎉 Cuenta verificada</h2></div>
    <div class="content">
      <h3 class="ok">¡Todo listo!</h3>
      <p class="muted">Tu usuario ha sido verificado. Ya puedes cerrar esta ventana.</p>
    </div>
  </div>
</body></html>`);
  } catch (error) {
    await t.rollback();
    res.status(400).type('html').send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Verificación — Token inválido o expirado</title>
<style>
  :root{--primary:#CF5C36;--primary2:#E8744C;--bg:#f9fafb;--text:#111827;--border:#e5e7eb;--muted:#6b7280;--err:#dc2626}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:24px}
  .card{max-width:560px;width:100%;background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
  .header{background:linear-gradient(90deg,var(--primary),var(--primary2));color:#fff;padding:16px 20px}
  .header h2{margin:0;font-size:18px;font-weight:800}
  .content{padding:20px;text-align:center}
  .muted{color:var(--muted)}
  .err{color:var(--err)}
</style>
</head><body>
  <div class="card">
    <div class="header"><h2>📧 Verificación de cuenta</h2></div>
    <div class="content">
      <h3 class="err">Token inválido o expirado</h3>
      <p class="muted">${error.message}</p>
    </div>
  </div>
</body></html>`);
  }
};

// ===============================================
// Reenviar verificación de email
// ===============================================
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requerido" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    if (user.verified) return res.json({ message: "La cuenta ya está verificada" });

    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const token = generateVerificationToken(email);
    const link = `${baseUrl}/users/verify-email?token=${encodeURIComponent(token)}`;
    await sendVerificationEmail({ to: email, link, name: user.name });

    return res.json({ message: "Correo de verificación reenviado" });
  } catch (error) {
    return res.status(500).json({ message: "Error al reenviar verificación", error: error.message });
  }
};


