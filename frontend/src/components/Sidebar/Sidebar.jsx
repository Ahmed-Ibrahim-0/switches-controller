import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, PlusCircle, List, Search, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "./Sidebar.css";

const menuItems = [
  {
    to: "/",
    label: "Overview",
    icon: <Home size={20} />,
    roles: ["admin", "user"],
  },
  {
    to: "/search",
    label: "Search",
    icon: <Search size={20} />,
    roles: ["admin", "user"],
  },
  {
    to: "/list/faulty_not_sent",
    label: "Faulty Not Sent",
    icon: <List size={20} />,
    roles: ["admin", "user"],
  },
  {
    to: "/list/sent_for_fix",
    label: "Sent for Fix",
    icon: <List size={20} />,
    roles: ["admin", "user"],
  },
  {
    to: "/list/fixed",
    label: "Fixed",
    icon: <List size={20} />,
    roles: ["admin", "user"],
  },
  {
    to: "/add",
    label: "Add Switch",
    icon: <PlusCircle size={20} />,
    roles: ["admin"],
  }, // only admin
];

export default function Sidebar() {
  const { role, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo / Title */}
      <div className="sidebar__logo">Switches</div>

      {/* Menu Items */}
      <nav className="sidebar__nav">
        {menuItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer" onClick={onLogout}>
        <LogOut size={20} />
        <span>Logout</span>
      </div>
    </aside>
  );
}
