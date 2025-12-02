import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import statusKeywords from "../utils/statusKeywords.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

export const login = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({
        status: statusKeywords.FAIL,
        message: "Name and password required",
      });

    const user = await User.findOne({ name });
    if (!user)
      return res.status(401).json({
        status: statusKeywords.FAIL,
        message: "Invalid credentials",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({
        status: statusKeywords.FAIL,
        message: "Invalid credentials",
      });

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      status: statusKeywords.SUCCESS,
      data: { token, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  // With JWT, logout is handled on frontend by deleting token
  res.status(200).json({
    status: statusKeywords.SUCCESS,
    message: "Logged out successfully",
  });
};
