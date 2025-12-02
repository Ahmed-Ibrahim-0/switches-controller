// === src/pages/Login.jsx ===
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // import the CSS
import logo from "../../assets/logo.png"; // default import

const Login = () => {
  const { handleLogin, loading } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await handleLogin(name, password);
    if (result.success) {
      navigate("/"); // adjust as needed
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Column - Form */}
        <div className="login-left">
          <h2>Welcome Back</h2>
          <p>login to view the website</p>
          <form onSubmit={onSubmit}>
            <div className="input-field">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(""); // Clear error when typing
                }}
                required
              />
            </div>

            <div className="input-field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(""); // Clear error when typing
                }}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? <span className="button-spinner"></span> : "Login"}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>

        {/* Right Column - Rotating Logo */}
        <div className="login-right">
          <div className="logo-wrapper">
            <img src={logo} alt="Logo" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
