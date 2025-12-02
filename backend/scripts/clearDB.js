// resetDB.js
import mongoose from "mongoose";
import Counter from "../models/counter.model.js";
import Switch from "../models/switch.model.js";
import { DB_URL } from "../config/env.js";

async function resetDatabase() {
  try {
    await mongoose.connect(DB_URL);

    console.log("Clearing Switch collection...");
    await Switch.deleteMany({});

    console.log("Clearing Counter collection...");
    await Counter.deleteMany({});

    // console.log("Recreating counter with seq = 0...");
    // await Counter.create({
    //   _id: "switches",
    //   seq: 0,
    // });

    console.log("✅ Database reset complete.");
    console.log("Next inserted switch will get uniqueKey = 1");

    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
}

resetDatabase();
