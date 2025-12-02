import axios from "axios";

const API_BASE = "http://localhost:4000/api/v1";

export const loginUser = async (name, password) => {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, { name, password });
    return res.data; // should include token and role
  } catch (err) {
    throw err.response?.data || { message: "Login failed" };
  }
};
