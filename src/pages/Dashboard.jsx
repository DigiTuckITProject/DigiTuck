import React from "react";

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your store.</p>
        </div>

        <div className="vendor-status">
          <span className="status-dot"></span>
          Store Active
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <p>Total Orders</p>
          <h2>15</h2>
          <small>Orders received</small>
        </div>

        <div className="stat-card">
          <p>Total Products</p>
          <h2>10</h2>
          <small>Products listed</small>
        </div>

        <div className="stat-card">
          <p>Pending Orders</p>
          <h2>2</h2>
          <small>Awaiting processing</small>
        </div>

        <div className="stat-card">
          <p>Total Sales</p>
          <h2>1000</h2>
          <small>Illustrative sales figure</small>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-card">
          <h3>Recent Orders</h3>
          <p>Your latest customer orders will appear here.</p>

          <div className="order-row">
            <span>#DT001</span>
            <span>R100.00</span>
            <span className="order-pending">Pending</span>
          </div>

          <div className="order-row">
            <span>#DT002</span>
            <span>R85.00</span>
            <span className="order-complete">Completed</span>
          </div>

          <div className="order-row">
            <span>#DT003</span>
            <span>R110.00</span>
            <span className="order-pending">Pending</span>
          </div>
        </div>

        <div className="content-card">
          <h3>Store Overview</h3>
          <p>Store status</p>
          <h2 className="active-text">Active</h2>
          <small>Your store is currently visible to customers.</small>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
