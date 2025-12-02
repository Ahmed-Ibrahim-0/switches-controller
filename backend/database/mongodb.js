import mongoose from "mongoose";
import { DB_URL, DB_PASSWORD } from "../config/env.js";

if (!DB_URL) {
  throw new Error("please define the mongo_url enviroment variable");
}

const connectToDB = async () => {
  try {
    const url = DB_URL.replace("<PASSWORD>", DB_PASSWORD);
    await mongoose.connect(url);
    console.log("connected to database");
  } catch (error) {
    console.log("Error connecting to database");
    process.exit(1);
  }
};

export default connectToDB;
