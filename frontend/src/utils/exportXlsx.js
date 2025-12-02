// src/utils/exportXlsx.js
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { fetchSwitchesByStatus, searchSwitchByField } from "../api/switches";

export const exportAllSwitchesToExcel = async (
  status,
  setLoading,
  openModal,
  query,
  token
) => {
  try {
    setLoading(true);
    let res;
    if (status === "search") {
      const [[field, value]] = Object.entries(query);
      res = await searchSwitchByField(field, value, token);
      console.log(res);
    } else {
      res = await fetchSwitchesByStatus(status, 1, 9999, query, token);
    }
    // Fetch switches
    const switches =
      status === "search" ? res?.data?.foundSwitch : res?.data?.switches;

    if (!switches.length) {
      openModal({
        title: "No Data",
        message: "There are no switches to export.",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Switches");

    // Fields to skip
    const skipFields = ["_id", "status", "createdAt", "updatedAt", "__v"];

    // Define status templates
    const statusTemplates = {
      fixed: [
        "uniqueKey",
        "provider",
        "oldSerialNumber",
        "newSerialNumber",
        "oldModel",
        "newModel",
        "notes",
        "deliveredStatus",
      ],
      sent_for_fix: [
        "uniqueKey",
        "provider",
        "serialNumber",
        "model",
        "notes",
        "dateSent",
      ],
      faulty_not_sent: [
        "uniqueKey",
        "provider",
        "serialNumber",
        "model",
        "notes",
      ],
      search: [
        "uniqueKey",
        "Status",
        "Provider",
        "serialNumber",
        "oldSerialNumber",
        "newSerialNumber",
        "notes",
        "deliveredStatus",
      ],
    };

    // Pick template based on status
    const headerKeys =
      statusTemplates[status] ||
      Object.keys(switches[0]).filter(
        (k) => !["_id", "status", "createdAt", "updatedAt", "__v"].includes(k)
      );

    // Define columns
    sheet.columns = headerKeys.map((key) => ({ header: key, key }));

    // Add rows
    switches.forEach((sw) => {
      const rowData = {};
      headerKeys.forEach((key) => {
        rowData[key] = sw[key] ?? "";
      });
      sheet.addRow(rowData);
    });

    // Style header row (first row)
    const headerRow = sheet.getRow(1);
    headerRow.height = 25; // taller
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Style all other cells
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Auto-fit column widths based on content
    sheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = maxLength + 2; // add padding
    });

    // Bold outer border
    const totalRows = sheet.rowCount;
    const totalCols = sheet.columns.length;

    // Top/Bottom borders
    for (let col = 1; col <= totalCols; col++) {
      const topCell = sheet.getCell(1, col);
      topCell.border = { ...topCell.border, top: { style: "medium" } };

      const bottomCell = sheet.getCell(totalRows, col);
      bottomCell.border = { ...bottomCell.border, bottom: { style: "medium" } };
    }

    // Left/Right borders
    for (let row = 1; row <= totalRows; row++) {
      const leftCell = sheet.getCell(row, 1);
      leftCell.border = { ...leftCell.border, left: { style: "medium" } };

      const rightCell = sheet.getCell(row, totalCols);
      rightCell.border = { ...rightCell.border, right: { style: "medium" } };
    }

    // Export workbook as blob for browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `switches_${status}.xlsx`);

    openModal({
      title: "Export Successful",
      message: `Successfully exported ${switches.length} switches.`,
    });
  } catch (err) {
    console.error("Error exporting to Excel:", err);
    openModal({
      title: "Export Failed",
      message: "Something went wrong while exporting.",
    });
  } finally {
    setLoading(false);
  }
};
