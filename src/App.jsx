import React, { useState } from "react";

// Import dashboard components
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/products";
import Orders from "./pages/Orders";
import StoreProfile from "./pages/StoreProfile";
import Settings from "./pages/Settings";

// Import application styling
import "./App.css";

function App() {
  // Tracks which page the vendor is currently viewing
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="app-container">
      {/* sidebar navigation */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* main pages content */}
      <main className="main-content">
        {activePage === "Dashboard" && <Dashboard />}

        {activePage === "Products" && <Products />}

        {activePage === "Orders" && <Orders />}

        {activePage === "Store Profile" && <StoreProfile />}

        {activePage === "Settings" && <Settings />}
      </main>
    </div>
  );
}

export default App;
