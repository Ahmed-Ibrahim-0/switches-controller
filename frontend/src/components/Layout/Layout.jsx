import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout__main">{children}</main>
    </div>
  );
}
