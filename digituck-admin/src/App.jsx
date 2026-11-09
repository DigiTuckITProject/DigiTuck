import React, { useState } from "react";

import AdminSidebar from "./components/AdminSidebar";

import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import VendorVerification from "./pages/VendorVerification";
import AdminSettings from "./pages/AdminSettings";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // Display the selected page
  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <AdminDashboard />;

      case "Users":
        return <UserManagement />;

      case "Verification":
        return <VendorVerification />;

      case "Settings":
        return <AdminSettings />;

      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="admin-main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
