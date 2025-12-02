import React, { useState } from "react";
import "./SearchSwitch.css";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import Loader from "../../Ui/Loader/Loader";
import useModal from "../../hooks/useModal";
import { searchSwitchByField } from "../../api/switches";
import { useAuth } from "../../hooks/useAuth";

export default function SearchSwitch() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth(); // get token & auth state
  const { modal, openModal, closeModal } = useModal();

  const [searchType, setSearchType] = useState("key"); // 'key' or 'serial'
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="unauthenticated-msg">Please login to search switches.</p>
    );
  }

  const handleSearch = async () => {
    if (!query.trim()) {
      openModal("message", {
        title: "Missing Input",
        message: "Please enter a value to search.",
      });
      return;
    }

    try {
      setLoading(true);
      const field = searchType === "key" ? "uniqueKey" : "serialNumber";

      // pass token from context to the API
      const res = await searchSwitchByField(
        field,
        query.trim().toUpperCase(),
        token
      );

      if (res?.status === "SUCCESS" && res.data?.foundSwitch) {
        const found = res.data.foundSwitch;

        if (Array.isArray(found)) {
          if (found.length === 1) {
            // Only one element, navigate to details page

            navigate(`/switch/${found[0].uniqueKey}`, { state: found[0] });
          } else if (found.length > 1) {
            // Multiple switches, navigate to list page
            navigate(`/list/search?serialNumber=${query}`, {
              state: { switches: found },
            });

            // });
          } else {
            throw new Error("No matching switch found.");
          }
        } else {
          // Single object, navigate to details page
          navigate(`/switch/${found.uniqueKey}`, { state: found });
        }
      } else {
        throw new Error(res?.message || "No matching switch found.");
      }
    } catch (err) {
      openModal("message", {
        title: "Search Error",
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Searching..." />;

  return (
    <div className="search-page">
      <h2 className={searchType}>Search By</h2>

      <div className="search-type-buttons">
        <button
          className={`type-btn ${searchType === "key" ? "active key" : ""}`}
          onClick={() => setSearchType("key")}
        >
          Key
        </button>
        <button
          className={`type-btn ${
            searchType === "serial" ? "active serial" : ""
          }`}
          onClick={() => setSearchType("serial")}
        >
          Serial Number
        </button>
      </div>

      <div className={`search-bar ${searchType}`}>
        <input
          type="text"
          placeholder={`Search by ${
            searchType === "key"
              ? "key (e.g., 1, 2...)"
              : "serial (e.g., SN5001...)"
          }`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button
          className={`search-btn ${searchType}`}
          onClick={handleSearch}
          disabled={loading}
        >
          <SearchIcon size={20} />
        </button>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || closeModal}
      />
    </div>
  );
}
