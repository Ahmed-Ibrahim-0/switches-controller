import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../../Ui/Loader/Loader";
import { fetchStats } from "../../api/switches"; // API utility
import { useAuth } from "../../hooks/useAuth"; // import auth context
import "./Overview.css";
import Note from "../../components/Note/Note";

export default function Overview() {
  const { token } = useAuth(); // get token from context
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getStats = async () => {
      try {
        if (!token) {
          setError("Not authenticated");
          return;
        }

        const res = await fetchStats(token); // pass token to API

        if (res.status === "SUCCESS") {
          setStats(res.data);
        } else {
          setError("Failed to fetch switch statistics.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getStats();
  }, [token]); // re-run if token changes

  if (loading) return <Loader text="Loading overview..." />;

  if (error) return <p className="overview-error">{error}</p>;

  const handleCardClick = (status) => {
    navigate(`/list/${status}`);
  };

  const statusOrder = ["faulty_not_sent", "sent_for_fix", "fixed"];

  const orderedBreakdown = statusOrder
    .map((status) => stats.breakdown.find((item) => item.status === status))
    .filter(Boolean);

  return (
    <div className="overview-container">
      <h1 className="overview-title">Switches Overview</h1>

      <div className="overview-cards">
        {orderedBreakdown.map((item) => (
          <div
            key={item.status}
            className={`overview-card`}
            style={{
              borderColor: `var(--${item.status.replaceAll("_", "-")})`,
            }}
            onClick={() => handleCardClick(item.status)}
          >
            <h2>{item.count}</h2>
            <p>{item.status.replace(/_/g, " ")}</p>
          </div>
        ))}
      </div>

      <div className="overview-total">
        <strong>Total Switches: {stats.total}</strong>
      </div>
      {(stats.noProviderCount > 0 ||
        stats.deliveredCount > 0 ||
        stats.notDeliveredCount > 0) && (
        <div className="overview-notes">
          <h2>Notes</h2>
          <ul>
            <ul>
              {stats.noProviderCount > 0 && (
                <Note
                  text={`There ${stats.noProviderCount === 1 ? "is" : "are"} ${
                    stats.noProviderCount
                  } fixed switch${
                    stats.noProviderCount === 1 ? "" : "es"
                  } that ${
                    stats.noProviderCount === 1 ? "has" : "have"
                  } no provider.`}
                  onView={() =>
                    navigate({
                      pathname: "/list/fixed",
                      search: "?provider=false",
                    })
                  }
                />
              )}

              {stats.deliveredCount > 0 && (
                <Note
                  text={`There ${stats.deliveredCount === 1 ? "is" : "are"} ${
                    stats.deliveredCount
                  } fixed switch${
                    stats.deliveredCount === 1 ? "" : "es"
                  } that ${
                    stats.deliveredCount === 1 ? "has" : "have"
                  } been delivered.`}
                  onView={() =>
                    navigate({
                      pathname: "/list/fixed",
                      search: "?deliveredStatus=delivered",
                    })
                  }
                />
              )}

              {stats.notDeliveredCount > 0 && (
                <Note
                  text={`There ${
                    stats.notDeliveredCount === 1 ? "is" : "are"
                  } ${stats.notDeliveredCount} fixed switch${
                    stats.notDeliveredCount === 1 ? "" : "es"
                  } that ${
                    stats.notDeliveredCount === 1 ? "has" : "have"
                  }n't been delivered yet.`}
                  onView={() =>
                    navigate({
                      pathname: "/list/fixed",
                      search: "?deliveredStatus=not_delivered",
                    })
                  }
                />
              )}
            </ul>
          </ul>
        </div>
      )}
    </div>
  );
}
