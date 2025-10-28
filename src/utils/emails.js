// src/utils/email.js
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Fuerza IPv4 primero para evitar ENETUNREACH en redes sin IPv6
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch {}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarCorreo({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"Shop&Buy" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Correo enviado a:', to);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw error;
  }
}

export function renderTemplate(templateFile, data = {}) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, 'templates', templateFile);
  let html = fs.readFileSync(filePath, 'utf8');
  Object.entries(data).forEach(([key, value]) => {
    const re = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(re, String(value ?? ''));
  });
  return html;
}

export async function sendVerificationEmail({ to, link, name }) {
  const html = renderTemplate('emailVerification.html', { link, name: name || '' });
  return enviarCorreo({ to, subject: 'Verifica tu cuenta', html });
}

export async function sendPasswordResetEmail({ to, link, name }) {
  const html = renderTemplate('passwordReset.html', { link, name: name || '' });
  return enviarCorreo({ to, subject: 'Restablece tu contraseña', html });
}
