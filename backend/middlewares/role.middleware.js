// src/middlewares/role.middleware.js
import statusKeywords from "../utils/statusKeywords.js";

// Middleware to check if user has required role
export const verifyRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: statusKeywords.FAIL,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (requiredRole && req.user.role !== requiredRole) {
      return res.status(403).json({
        status: statusKeywords.FAIL,
        message: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};
