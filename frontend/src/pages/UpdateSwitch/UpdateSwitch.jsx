// src/pages/UpdateSwitch/UpdateSwitch.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./UpdateSwitch.css";
import { RefreshCw } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import useModal from "../../hooks/useModal";
import { updateSwitch } from "../../api/switches";
import { useAuth } from "../../hooks/useAuth";

export default function UpdateSwitch() {
  const { uniqueKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { modal, openModal, closeModal } = useModal();
  const { role, token } = useAuth(); // use context token & role
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [status, setStatus] = useState(
    location.state?.status || "faulty_not_sent"
  );
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === Define dynamic fields per status ===
  const fieldsByStatus = {
    faulty_not_sent: [
      { name: "serialNumber", label: "Serial Number" },
      { name: "provider", label: "Provider" },
      { name: "model", label: "Model" },
      { name: "notes", label: "Notes" },
    ],
    sent_for_fix: [
      { name: "serialNumber", label: "Serial Number" },
      { name: "provider", label: "Provider" },
      { name: "model", label: "Model" },
      { name: "dateSent", label: "Date Sent", type: "date" },
      { name: "notes", label: "Notes" },
    ],
    fixed: [
      { name: "provider", label: "Provider" },
      { name: "oldSerialNumber", label: "Old Serial Number" },
      { name: "oldModel", label: "Old Model" },
      { name: "newSerialNumber", label: "New Serial Number" },
      { name: "newModel", label: "New Model" },
      { name: "notes", label: "Notes" },
      { name: "deliveredStatus", label: "Delivered Status" },
    ],
  };

  // === Prefill formData from location.state only once ===
  useEffect(() => {
    if (location.state) {
      setFormData({ ...location.state });
    }
  }, [location.state]);

  // === Restrict access to admin users ===
  useEffect(() => {
    if (role && role !== "admin") {
      openModal({
        type: "message",
        title: "Access Denied",
        message: "You are not authorized to update switches.",
        onConfirm: () => navigate("/"),
      });
    }
  }, [role, navigate, openModal]);

  // === Handle field changes ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // === Handle status change logic ===
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);

    setFormData((prev) => {
      const updated = {};

      // Preserve provider and notes always
      updated.provider = prev.provider || "";
      updated.notes = prev.notes || "";

      // Map relevant fields based on status
      if (newStatus === "faulty_not_sent") {
        updated.serialNumber = prev.serialNumber || "";
        updated.model = prev.model || "";
      } else if (newStatus === "sent_for_fix") {
        updated.serialNumber = prev.serialNumber || "";
        updated.model = prev.model || "";
        updated.dateSent = prev.dateSent || "";
      } else if (newStatus === "fixed") {
        updated.oldSerialNumber =
          prev.serialNumber || prev.oldSerialNumber || "";
        updated.oldModel = prev.model || prev.oldModel || "";
        updated.newSerialNumber = prev.newSerialNumber || "";
        updated.newModel = prev.newModel || "";
      }

      updated.status = newStatus;
      return updated;
    });
  };

  // === Submit handler ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      openModal({
        type: "message",
        title: "Unauthorized",
        message: "You must be logged in to update switches.",
      });
      return;
    }

    // --- Validation based on status ---
    if (
      (status === "faulty_not_sent" || status === "sent_for_fix") &&
      !formData.serialNumber?.trim()
    ) {
      openModal("message", {
        isOpen: true,
        title: "❌ Validation Error",
        message: "Serial Number is required.",
      });
      return;
    }

    if (status === "fixed" && !formData.oldSerialNumber?.trim()) {
      openModal("message", {
        isOpen: true,
        title: "❌ Validation Error",
        message: "Old Serial Number is required for fixed switches.",
      });
      return;
    }
    try {
      setIsSubmitting(true);

      // Only include fields relevant for the current status
      const allowedFields = fieldsByStatus[status].map((f) => f.name);
      const payload = { uniqueKey, status };

      allowedFields.forEach((key) => {
        const value = formData[key];
        if (value !== undefined && value !== null && value !== "") {
          payload[key] = value;
        }
      });

      // Pass token from context
      const res = await updateSwitch(payload, token);

      if (res.status === "SUCCESS") {
        openModal("message", {
          title: "✅ Switch Updated!",
          message: "The switch has been updated successfully.",
          confirmText: "View Details",
          onConfirm: () =>
            navigate(`/switch/${uniqueKey}`, {
              state: res.data.updatedSwitch,
            }),
        });
      } else {
        throw new Error(res.message || "Failed to update switch");
      }
    } catch (err) {
      openModal("message", {
        title: "❌ Error",
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="update-switch-page">
      <h2>Update Switch</h2>

      <div className="form-container">
        {/* === Status Selector === */}
        <div className="status-selector">
          {["faulty_not_sent", "sent_for_fix", "fixed"].map((s) => (
            <button
              key={s}
              className={`status-tab ${
                status === s ? `active ${s.replaceAll("_", "-")}` : ""
              }`}
              onClick={() => handleStatusChange(s)}
              disabled={isSubmitting || role !== "admin"}
            >
              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* === Dynamic Form === */}
        <form
          className={`update-switch-form shadow-${status.replaceAll("_", "-")}`}
          onSubmit={handleSubmit}
        >
          <div className="update-form-group-container">
            {fieldsByStatus[status].map(({ name, label, type = "text" }) => (
              <div key={name} className="update-form-group">
                <label htmlFor={name}>
                  {label}
                  {/* Add star for required fields */}
                  {((status === "faulty_not_sent" ||
                    status === "sent_for_fix") &&
                    name === "serialNumber") ||
                  (status === "fixed" && name === "oldSerialNumber") ? (
                    <span className="required-star">*</span>
                  ) : null}
                </label>

                {name === "deliveredStatus" && status === "fixed" ? (
                  <div
                    className={`custom-dropdown ${
                      isSubmitting ? "disabled" : ""
                    }`}
                    tabIndex={0}
                    onBlur={() => setDropdownOpen(false)}
                  >
                    <div
                      className="selected-option"
                      onClick={() =>
                        !isSubmitting && setDropdownOpen((prev) => !prev)
                      }
                    >
                      {formData[name] === "delivered"
                        ? "Delivered"
                        : "Not Delivered"}
                      <span className={`arrow ${dropdownOpen ? "open" : ""}`}>
                        ▼
                      </span>
                    </div>

                    {dropdownOpen && (
                      <ul className="options-list">
                        {["delivered", "not_delivered"].map((option) => (
                          <li
                            key={option}
                            className={
                              formData[name] === option ? "active" : ""
                            }
                            onClick={() => {
                              handleChange({ target: { name, value: option } });
                              setDropdownOpen(false);
                            }}
                          >
                            {option === "delivered"
                              ? "Delivered"
                              : "Not Delivered"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <input
                    id={name}
                    name={name}
                    type={type}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="update-submit-btn"
            disabled={isSubmitting || role !== "admin"}
          >
            {isSubmitting ? (
              <span className="spinner"></span>
            ) : (
              <>
                <RefreshCw size={18} /> Update Switch
              </>
            )}
          </button>
        </form>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText || "OK"}
        onConfirm={modal.onConfirm || closeModal}
      />
    </div>
  );
}
