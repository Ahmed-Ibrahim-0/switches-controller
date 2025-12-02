import express from "express";
import { login, logout } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/login", login);
userRouter.post("/logout", logout);

export default userRouter;
