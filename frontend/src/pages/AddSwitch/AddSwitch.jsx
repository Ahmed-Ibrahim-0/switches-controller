import React, { useEffect, useState } from "react";
import "./AddSwitch.css";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal/Modal";
import useModal from "../../hooks/useModal";
import { createSwitch } from "../../api/switches";
import { PlusCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function AddSwitch() {
  const navigate = useNavigate();
  const { modal, openModal, closeModal } = useModal();
  const { token, role } = useAuth();

  const [status, setStatus] = useState("faulty_not_sent");
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Set default deliveredStatus when status is "fixed"
  useEffect(() => {
    if (status === "fixed") {
      setFormData((prev) => ({
        ...prev,
        deliveredStatus: prev.deliveredStatus ?? "not_delivered",
      }));
    }
  }, [status]);

  if (role && role !== "admin") {
    return <p>You do not have permission to add switches.</p>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      openModal("message", {
        isOpen: true,
        title: "❌ Not Authenticated",
        message: "Please login to perform this action.",
      });
      return;
    }

    // --- Conditional validation ---
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
      const payload = { ...formData, status };
      const res = await createSwitch(payload, token);

      if (res.status === "SUCCESS") {
        const newSwitch = res.data.newSwitch;
        openModal("message", {
          title: "✅ Switch Added!",
          message: "The switch was added successfully.",
          confirmText: "View Details",
          onConfirm: () =>
            navigate(`/switch/${newSwitch.uniqueKey}`, { state: newSwitch }),
        });
      } else {
        throw new Error(res.message || "Failed to add switch");
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
    <div className="add-switch-page">
      <h2>Add New Switch</h2>

      <div className="form-container">
        {/* Status Selector */}
        <div className="status-selector">
          {["faulty_not_sent", "sent_for_fix", "fixed"].map((s) => (
            <button
              key={s}
              className={`status-tab ${
                status === s ? "active " + s.replaceAll("_", "-") : ""
              }`}
              onClick={() => setStatus(s)}
              disabled={isSubmitting}
            >
              {s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Dynamic Form */}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner"></span>
            ) : (
              <>
                <PlusCircle size={18} /> Add Switch
              </>
            )}
          </button>
        </form>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || closeModal}
        confirmText={modal.confirmText || "OK"}
        onCancel={modal.type === "confirm" ? closeModal : null}
      />
    </div>
  );
}
