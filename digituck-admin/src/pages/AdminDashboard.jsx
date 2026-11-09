import React from "react";

function AdminDashboard() {
  // Sample dashboard statistics
  const stats = [
    {
      title: "Total Customers",
      value: 120,
    },
    {
      title: "Registered Vendors",
      value: 35,
    },
    {
      title: "Pending Verifications",
      value: 8,
    },
    {
      title: "Approved Vendors",
      value: 27,
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to the DigiTuck Admin Portal.</p>
        </div>
      </div>

      {/* Dashboard statistics */}
      <div className="admin-stats">
        {stats.map((stat) => (
          <div className="admin-stat-card" key={stat.title}>
            <p>{stat.title}</p>
            <h2>{stat.value}</h2>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="admin-section">
        <h2>Platform Overview</h2>
        <p>
          Use the admin portal to manage customer accounts and review vendor
          registration applications.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
