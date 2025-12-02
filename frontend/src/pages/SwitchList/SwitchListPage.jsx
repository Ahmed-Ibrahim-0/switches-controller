import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import SwitchList from "./SwitchList";
import { fetchSwitchesByStatus, searchSwitchByField } from "../../api/switches";
import Loader from "../../Ui/Loader/Loader";
import { useAuth } from "../../hooks/useAuth";
import "./SwitchListPage.css";

export default function SwitchListPage() {
  const { status } = useParams();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [switches, setSwitches] = useState(null); // null = not loaded yet
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = 10;

  // Memoized query object
  const query = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams]
  );

  // Memoized header text
  const headerText = useMemo(() => {
    if (query.provider === "false")
      return "Fixed switches that have no provider";
    if (query.deliveredStatus === "delivered")
      return "Fixed switches that have been delivered";
    if (query.deliveredStatus === "not_delivered")
      return "Fixed switches that haven't been delivered yet";
    return `${status.replaceAll("_", " ")} switches`;
  }, [query, status]);

  // Reset state when status or searchKey changes
  const searchKey = searchParams.toString();
  useEffect(() => {
    setPage(1);
    setTotalPages(1);
    setTotalCount(0);
    setLoading(true);
    setSwitches(null); // clear old data immediately
  }, [status, searchKey]);

  useEffect(() => {
    const loadSwitches = async () => {
      setLoading(true);
      try {
        let switchesData = [];
        let paginationData = {};

        if (status === "search" && query?.serialNumber) {
          const res = await searchSwitchByField(
            "serialNumber",
            query.serialNumber.toUpperCase(),
            token
          );

          const found = res?.data?.foundSwitch;

          if (found) {
            switchesData = Array.isArray(found) ? found : [found];
            paginationData.totalPages = 1;
            paginationData.totalRecords = switchesData.length;
          }
        } else {
          // Normal status mode
          const res = await fetchSwitchesByStatus(
            status.replaceAll(" ", "_"),
            page,
            limit,
            query,
            token
          );
          switchesData = res?.data?.switches || [];
          paginationData = res?.data?.pagination || {};
        }

        setSwitches(switchesData);
        setTotalPages(paginationData.totalPages || 1);
        setTotalCount(paginationData.totalRecords || switchesData.length || 0);
      } catch (err) {
        console.error("Error loading switches:", err);
        setSwitches([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadSwitches();
  }, [status, page, token, query]);

  return (
    <div className="switch-list-page">
      {loading || switches === null ? (
        <div className="loader-fullscreen">
          <Loader text={`Loading ${status.replaceAll("_", " ")} switches...`} />
        </div>
      ) : (
        <>
          <SwitchList
            switches={switches}
            status={status}
            headerText={headerText}
            loadingStatus={loading} // pass loading flag
            query={query}
            key={status + searchParams.toString()}
          />

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="page-btn"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="page-btn"
            >
              Next
            </button>
            <span className="pagination-count">
              {page < totalPages ? limit : switches.length} of {totalCount}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
