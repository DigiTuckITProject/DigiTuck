import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="main-content">
        {activePage === "Dashboard" && <Dashboard />}

        {activePage !== "Dashboard" && <h1>{activePage}</h1>}
      </main>
    </div>
  );
}

export default App;
