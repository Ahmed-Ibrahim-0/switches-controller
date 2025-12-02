import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Overview from "./pages/Overview/Overview";
import AddSwitch from "./pages/AddSwitch/AddSwitch";
import SwitchListPage from "./pages/SwitchList/SwitchListPage";
import SwitchDetails from "./pages/SwitchDetails/SwitchDetails";
import SearchSwitch from "./pages/SearchSwitch/SearchSwitch";
import UpdateSwitch from "./pages/UpdateSwitch/UpdateSwitch";
import Login from "./pages/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect to login if no valid token */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/search" element={<SearchSwitch />} />
                  <Route path="/add" element={<AddSwitch />} />
                  <Route path="/list/:status" element={<SwitchListPage />} />
                  <Route
                    path="/switch/:uniqueKey"
                    element={<SwitchDetails />}
                  />
                  <Route path="/update/:uniqueKey" element={<UpdateSwitch />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
