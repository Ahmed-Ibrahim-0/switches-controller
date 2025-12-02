// src/components/Switches/SwitchList.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportAllSwitchesToExcel } from "../../utils/exportXlsx.js";
import Modal from "../../components/Modal/Modal.jsx";
import "./SwitchList.css";
import { useAuth } from "../../hooks/useAuth.js";

export default function SwitchList({
  switches,
  status,
  headerText,
  loadingStatus,
  query = {},
}) {
  const navigate = useNavigate();
  // === Internal states ===
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const { token } = useAuth();

  if (loadingStatus || switches === null) return null; // nothing rendered until data arrives

  const openModal = ({ title, message }) => setModalData({ title, message });
  const closeModal = () => setModalData(null);

  // === Column definitions ===
  const labelMap = {
    serialNumber: "S.N",
    oldSerialNumber: "Old S.N",
    newSerialNumber: "New S.N",
    oldModel: "Old Model",
    newModel: "New Model",
    dateSent: "Date Sent",
    provider: "Provider",
    model: "Model",
    notes: "Notes",
    deliveredStatus: "Delivered Status",
    status: "Status",
  };

  const allColumnsByStatus = {
    faulty_not_sent: ["provider", "serialNumber", "model", "notes"],
    sent_for_fix: ["provider", "serialNumber", "model", "dateSent", "notes"],
    fixed: [
      "provider",
      "oldSerialNumber",
      "oldModel",
      "newSerialNumber",
      "newModel",
      "notes",
      "deliveredStatus",
    ],
    search: [
      "status",
      "provider",
      "serialNumber",
      "oldSerialNumber",
      "newSerialNumber",
      "notes",
      "deliveredStatus",
    ],
  };

  const allKeys = allColumnsByStatus[status] || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // === Export handler with button spinner ===
  const handleExport = async () => {
    await exportAllSwitchesToExcel(status, setLoading, openModal, query, token);
  };

  return (
    <div className="switch-table-container">
      {/* Modal */}
      {modalData && (
        <Modal
          isOpen={!!modalData}
          title={modalData.title}
          message={modalData.message}
          onConfirm={closeModal}
        />
      )}

      {/* Header + Export */}
      <div className="switch-list-header">
        <h2>{headerText}</h2>
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? <span className="spinner"></span> : "Export to Excel"}
        </button>
      </div>

      {/* Table */}
      <table className="switch-table">
        <thead>
          <tr>
            <th>Key</th>
            {allKeys.map((key) => (
              <th key={key}>{labelMap[key] || key}</th>
            ))}
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {switches.length === 0 ? (
            <tr key="no-switches">
              <td colSpan={allKeys.length + 2} className="no-data">
                No switches found.
              </td>
            </tr>
          ) : (
            switches.map((sw) => (
              <tr
                key={sw.uniqueKey}
                className="clickable-row"
                onClick={() =>
                  navigate(`/switch/${sw.uniqueKey}`, { state: sw })
                }
              >
                <td>{sw.uniqueKey}</td>

                {allKeys.map((key) => {
                  if (key === "dateSent")
                    return <td key={key}>{formatDate(sw[key])}</td>;

                  if (key === "deliveredStatus")
                    return (
                      <td key={key}>
                        {sw[key] === "delivered"
                          ? "✅ Delivered"
                          : "❌ Not Delivered"}
                      </td>
                    );

                  if (key === "status")
                    return (
                      <td key={key} className={`status ${sw[key]}`}>
                        {sw[key].replaceAll("_", " ")}
                      </td>
                    );

                  // Apply 'notes' style to long text fields
                  const ellipsisFields = [
                    "notes",
                    "provider",
                    "model",
                    "oldModel",
                    "newModel",
                  ];
                  if (ellipsisFields.includes(key))
                    return (
                      <td key={key} className="notes">
                        {sw[key] || "-"}
                      </td>
                    );

                  // Default rendering
                  return <td key={key}>{sw[key] || "-"}</td>;
                })}

                <td>{formatDate(sw.updatedAt)} </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
