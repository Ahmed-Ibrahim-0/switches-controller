import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model.js"; // adjust path if different

import { DB_URL } from "../config/env.js";
async function createDefaultUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(DB_URL);

    const usersToCreate = [
      { name: "admin", password: "Admin@123", role: "admin" },
      { name: "user", password: "User@123", role: "user" },
    ];

    for (const u of usersToCreate) {
      const exists = await User.findOne({ name: u.name });

      if (exists) {
        console.log(`⚠️ User "${u.name}" already exists. Skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(u.password, 10);

      const newUser = new User({
        name: u.name,
        password: hashedPassword,
        role: u.role,
      });

      await newUser.save();
      console.log(`✅ Created user: ${u.name} (${u.role})`);
    }

    console.log("🎉 Done.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating users:", err);
    process.exit(1);
  }
}

createDefaultUsers();
