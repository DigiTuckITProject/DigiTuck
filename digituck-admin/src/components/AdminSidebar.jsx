import React from "react";

function AdminSidebar({ activePage, setActivePage }) {
  const menuItems = [
    { name: "Dashboard", label: "Dashboard" },
    { name: "Users", label: "User Management" },
    { name: "Verification", label: "Vendor Verification" },
    { name: "Settings", label: "Settings" },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <h2>DigiTuck</h2>
        <p>Admin Portal</p>
      </div>

      <nav>
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={activePage === item.name ? "active" : ""}
            onClick={() => setActivePage(item.name)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
