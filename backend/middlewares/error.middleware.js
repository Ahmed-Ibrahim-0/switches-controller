import statusKeywords from "../utils/statusKeywords.js";

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const status = err.status || statusKeywords.ERROR;

  return res.status(statusCode).json({
    status,
    message: err.message || "Internal Server Error",
  });
};
export default errorHandler;
