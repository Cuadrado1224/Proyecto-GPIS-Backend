import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Email verification token (includes email in payload)
export const generateVerificationToken = (email) => {
  const secret = process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_SECRET;
  return jwt.sign({ email, type: "verify" }, secret, { expiresIn: "24h" });
};

export const verifyVerificationToken = (token) => {
  const secret = process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

// Password reset token (includes email in payload)
export const generatePasswordResetToken = (email) => {
  const secret = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET;
  return jwt.sign({ email, type: "reset" }, secret, { expiresIn: "1h" });
};

export const verifyPasswordResetToken = (token) => {
  const secret = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};
