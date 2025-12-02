// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import statusKeywords from "../utils/statusKeywords.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: statusKeywords.FAIL,
        message: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // attach user info to request
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      status: statusKeywords.FAIL,
      message: "Unauthorized: Invalid token",
    });
  }
};
