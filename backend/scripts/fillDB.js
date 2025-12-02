import mongoose from "mongoose";
import XLSX from "xlsx";
import Switch from "../models/switch.model.js";
import { DB_URL } from "../config/env.js";

function cleanRecord(obj) {
  const cleaned = {};
  for (const key in obj) {
    const value = obj[key];

    // Skip undefined, null, empty string, NaN
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(typeof value === "number" && isNaN(value))
    ) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function parseExcelDate(value) {
  if (!value) return null;

  // Check if it's a number → Excel serial date
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000)); // convert days to ms
    return date;
  }

  // Check if it's a string → parse DD/MM/YYYY
  if (typeof value === "string") {
    const [day, month, year] = value.split("/").map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  }

  return null;
}

async function runImport() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(DB_URL);

    console.log("Reading Excel...");
    const workbook = XLSX.readFile("./scripts/excel.xlsx");

    const faultySheet = XLSX.utils.sheet_to_json(
      workbook.Sheets["faulty not sent"]
    );
    const sentSheet = XLSX.utils.sheet_to_json(workbook.Sheets["sent for fix"]);
    const fixedSheet = XLSX.utils.sheet_to_json(workbook.Sheets["fixed"]);

    let records = [];

    // -------------------------
    // 3️⃣ Fixed
    // -------------------------
    fixedSheet.forEach((row) => {
      const record = cleanRecord({
        provider: row.provider,
        oldSerialNumber: row.oldSerialNumber,
        newSerialNumber: row.newSerialNumber,
        oldModel: row.oldModel,
        newModel: row.newModel,
        notes: row.notes,
        status: "fixed",
        deliveredStatus: "not_delivered",
      });

      records.push(record);
    });

    // -------------------------
    // 2️⃣ Sent for Fix
    // -------------------------
    sentSheet.forEach((row) => {
      const record = cleanRecord({
        provider: row.provider,
        serialNumber: row.serialNumber,
        model: row.model,
        notes: row.notes,
        dateSent: parseExcelDate(row.dateSent),
        status: "sent_for_fix",
      });

      records.push(record);
    });

    // -------------------------
    // 1️⃣ Faulty Not Sent
    // -------------------------
    faultySheet.forEach((row) => {
      const record = cleanRecord({
        provider: row.provider,
        serialNumber: row.serialNumber,
        model: row.model,
        notes: row.notes,
        status: "faulty_not_sent",
      });

      records.push(record);
    });

    console.log("Inserting...");

    for (const rec of records) {
      const doc = new Switch(rec);
      await doc.save(); // <-- THIS runs pre-save hook and generates uniqueKey
    }

    console.log(`✅ Done! Inserted ${records.length} records.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runImport();
