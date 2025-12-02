import axios from "axios";

const API_BASE = "http://localhost:4000/api/v1";

// ===== API Calls =====
// All functions now accept `token` from context

export const searchSwitchByField = async (field, value, token) => {
  const res = await axios.get(`${API_BASE}/switches/search`, {
    params: { field, value },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    validateStatus: () => true,
  });

  if (res.data.status === "SUCCESS") {
    return res.data;
  }

  return null;
};

export const deleteSwitch = (uniqueKey, token) => {
  return axios.delete(`${API_BASE}/switches/${uniqueKey}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const createSwitch = async (data, token) => {
  const res = await axios.post(`${API_BASE}/switches`, data, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data;
};

export const fetchSwitchesByStatus = async (
  status,
  page = 1,
  limit = 20,
  queryParams = {},
  token
) => {
  const res = await axios.get(`${API_BASE}/switches/filter`, {
    params: { status, page, limit, ...queryParams }, // <- flatten here
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};

export const fetchStats = async (token) => {
  const res = await axios.get(`${API_BASE}/switches/stats`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};

export const updateSwitch = async (payload, token) => {
  const res = await axios.put(
    `${API_BASE}/switches/${payload.uniqueKey}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return res.data;
};
