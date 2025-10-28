import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("✅ Conexión SMTP exitosa");
  } catch (err) {
    console.error("❌ Error de conexión:", err);
  }
})();
