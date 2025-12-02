// === src/pages/SwitchDetails/SwitchDetails.jsx ===
import React, { useState } from "react";
import "./SwitchDetails.css";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Modal from "../../components/Modal/Modal";
import Loader from "../../Ui/Loader/Loader";
import useFetchSwitch from "../../hooks/useFetchSwitch";
import useModal from "../../hooks/useModal";
import { deleteSwitch } from "../../api/switches";
import { useAuth } from "../../hooks/useAuth";

const SwitchDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { uniqueKey } = useParams();
  const { role, token } = useAuth(); // 🔑 get user role & token

  // ✅ Fetch switch data with token
  const { switchData: foundSwitch, isLoading } = useFetchSwitch(
    uniqueKey,
    location.state,
    token // pass token to the hook
  );

  // ✅ Modal logic
  const { modal, openModal, closeModal } = useModal();

  // ✅ Delete & navigation state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const ignoredKeys = ["_id", "createdAt", "updatedAt", "__v"];
  const formatValue = (key, value) => {
    if (key.toLowerCase().includes("date")) {
      return new Date(value).toLocaleDateString();
    }
    return value?.toString() || "-";
  };

  // === Delete Logic ===
  const handleDelete = () => {
    openModal("confirm", {
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this switch?",
      onConfirm: confirmDelete,
    });
  };

  const confirmDelete = async () => {
    if (!token) return; // ensure token exists
    closeModal();
    setIsDeleting(true);
    try {
      await deleteSwitch(foundSwitch.uniqueKey, token); // pass token

      openModal("message", {
        title: "🗑️ Deleted!",
        message: "Switch deleted successfully.",
        confirmText: "Back to Overview",
        onConfirm: () => navigate("/"),
      });
    } catch (err) {
      console.error(err);
      openModal("message", {
        title: "❌ Error",
        message: "Failed to delete the switch.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // === Update Logic ===
  const handleUpdate = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(`/update/${foundSwitch.uniqueKey}`, { state: foundSwitch });
    }, 300);
  };

  // === Loading State ===
  if (isLoading) return <Loader text="Loading switch details..." />;

  // === Not Found ===
  if (!foundSwitch) {
    return (
      <div className="switch-details-container">
        <h2>Switch Not Found</h2>
        <button
          className="action-button update-btn"
          onClick={() => navigate("/search")}
        >
          Back to Search
        </button>
      </div>
    );
  }

  // === Main UI ===
  return (
    <div className="switch-details-container">
      <h2>{foundSwitch.provider}</h2>

      <div className="switch-card">
        {/* Switch Info */}
        <div className="switch-info">
          {Object.entries(foundSwitch)
            .filter(([key]) => !ignoredKeys.includes(key) && foundSwitch[key])
            .map(
              ([key, value]) =>
                key !== "provider" &&
                key !== "status" && (
                  <p key={key}>
                    <strong>{key.replace(/([A-Z])/g, " $1").trim()}:</strong>{" "}
                    {formatValue(key, value)}
                  </p>
                )
            )}
        </div>

        {/* Status + Actions */}
        <div className="switch-header">
          <p className={`status-text status-${foundSwitch.status}`}>
            {foundSwitch.status.replace(/_/g, " ")}
          </p>

          {/* Admin Only Action Buttons */}
          {role === "admin" && (
            <div className="switch-actions">
              <button
                className="action-button update-btn"
                onClick={handleUpdate}
                disabled={isDeleting || isNavigating}
              >
                {isNavigating ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <Pencil size={18} /> Update
                  </>
                )}
              </button>

              <button
                className="action-button delete-btn"
                onClick={handleDelete}
                disabled={isDeleting || isNavigating}
              >
                {isDeleting ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <Trash2 size={18} /> Delete
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || closeModal}
        onCancel={modal.type === "confirm" ? closeModal : null}
        confirmText={
          modal.confirmText || (modal.type === "confirm" ? "Yes" : "OK")
        }
      />
    </div>
  );
};

export default SwitchDetails;
