import express from "express";
import { PORT } from "./config/env.js";
import connectToDB from "./database/mongodb.js";
import switchRouter from "./routes/switch.route.js";
import errorHandler from "./middlewares/error.middleware.js";
import cors from "cors";
import userRouter from "./routes/user.route.js";
import { verifyToken } from "./middlewares/authorization.middleware.js";
const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/v1/switches", verifyToken, switchRouter);
app.use("/api/v1/auth", userRouter);

app.use(errorHandler);

connectToDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

export default app;
