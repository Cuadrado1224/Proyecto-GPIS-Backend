import { verifyToken } from "../utils/jwt.js";

export function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (!token) return res.status(401).json({ message: "Token requerido" });

	try {
		const user = verifyToken(token);
		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Token inválido" });
	}
}
