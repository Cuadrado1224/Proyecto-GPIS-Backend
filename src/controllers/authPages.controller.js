import sequelize from "../config/database.js";
import { User } from "../models/index.js";
import { renderTemplate } from "../utils/emails.js";
import { verifyVerificationToken, verifyPasswordResetToken } from "../utils/jwt.js";

export const verifyEmailPage = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { token } = req.query;
    if (!token) {
      const html = renderTemplate('genericPage.html', { title: 'Token requerido', message: 'Falta el token de verificación.' });
      await t.rollback();
      return res.status(400).type('html').send(html);
    }
    const payload = verifyVerificationToken(token);
    if (payload.type !== 'verify') {
      const html = renderTemplate('genericPage.html', { title: 'Token inválido', message: 'El token de verificación no es válido.' });
      await t.rollback();
      return res.status(400).type('html').send(html);
    }
    const user = await User.findOne({ where: { email: payload.email }, transaction: t });
    if (!user) {
      const html = renderTemplate('genericPage.html', { title: 'Usuario no encontrado', message: 'No pudimos ubicar tu cuenta.' });
      await t.rollback();
      return res.status(404).type('html').send(html);
    }
    if (!user.verified) {
      await user.update({ verified: true }, { transaction: t });
    }
    await t.commit();
    const html = renderTemplate('genericPage.html', { title: 'Cuenta verificada', message: 'Tu usuario ha sido verificado. Ya puedes cerrar esta ventana.' });
    return res.type('html').send(html);
  } catch (error) {
    await t.rollback();
    const html = renderTemplate('genericPage.html', { title: 'Token inválido o expirado', message: error.message });
    return res.status(400).type('html').send(html);
  }
};

export const resetPasswordPage = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      const html = renderTemplate('genericPage.html', { title: 'Token requerido', message: 'Falta el token para restablecer la contraseña.' });
      return res.status(400).type('html').send(html);
    }
    const payload = verifyPasswordResetToken(token);
    if (payload.type !== 'reset') {
      const html = renderTemplate('genericPage.html', { title: 'Token inválido', message: 'El token no es válido.' });
      return res.status(400).type('html').send(html);
    }
    const html = renderTemplate('passwordResetPage.html', { email: payload.email, token });
    return res.type('html').send(html);
  } catch (error) {
    const html = renderTemplate('genericPage.html', { title: 'Token inválido o expirado', message: error.message });
    return res.status(400).type('html').send(html);
  }
};

