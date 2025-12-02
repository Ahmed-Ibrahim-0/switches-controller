import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth"; // auth context
import { searchSwitchByField } from "../api/switches";

export default function useFetchSwitch(uniqueKey, initialData = null) {
  const { token } = useAuth(); // get token from context

  const [switchData, setSwitchData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData && !!uniqueKey);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchByKey = useCallback(
    async (key) => {
      if (!key || !token) return null;
      try {
        setIsLoading(true);
        setError(null);

        const res = await searchSwitchByField("uniqueKey", key, token);

        if (!mountedRef.current) return null;

        if (res?.status === "SUCCESS") {
          const found = res.data.foundSwitch;
          setSwitchData(found);
          return found;
        } else {
          const errMsg = res?.message || "Switch not found";
          setError(new Error(errMsg));
          setSwitchData(null);
          return null;
        }
      } catch (err) {
        if (!mountedRef.current) return null;
        setError(err);
        setSwitchData(null);
        return null;
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!initialData && uniqueKey && token) {
      fetchByKey(uniqueKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueKey, initialData, token]);

  const refetch = useCallback(
    () => fetchByKey(uniqueKey),
    [fetchByKey, uniqueKey]
  );

  return { switchData, setSwitchData, isLoading, error, refetch };
}
