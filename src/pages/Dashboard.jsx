import React from "react";

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Store information - populated from backend */}
        <div className="vendor-status">
          <div className="store-header-info">
            <h3 className="store-name">Your Store Name</h3>
            <small className="store-address">Your Store Address</small>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        {/* Total Orders */}
        <div className="stat-card">
          <p>Total Orders</p>
          <h2 className="total-orders-value">0</h2>
          <small className="orders-weekly-change">0% this week</small>
        </div>

        {/* Total Products */}
        <div className="stat-card">
          <p>Total Products</p>
          <h2 className="total-products-value">0</h2>
          <small className="products-listed-label">Products listed</small>
        </div>

        {/* Pending Orders */}
        <div className="stat-card">
          <p>Pending Orders</p>
          <h2 className="pending-orders-value">0</h2>
          <small className="pending-orders-label">Awaiting processing</small>
        </div>

        {/* Total Revenue */}
        <div className="stat-card">
          <p>Total Revenue</p>
          <h2 className="total-revenue-value">R0.00</h2>
          <small className="revenue-weekly-change">0% this week</small>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Incoming Customer Orders */}
        <div className="content-card">
          <h3 className="incoming-orders-title">Incoming Customer Orders</h3>

          <p className="incoming-orders-description">
            The latest customer orders will appear here.
          </p>

          <div className="incoming-orders-list">
            <div className="order-row">
              <span className="order-id">#DT001</span>
              <span className="order-amount">R0.00</span>
              <span className="order-status order-pending">Pending</span>
            </div>

            <div className="order-row">
              <span className="order-id">#DT002</span>
              <span className="order-amount">R0.00</span>
              <span className="order-status order-complete">Completed</span>
            </div>

            <div className="order-row">
              <span className="order-id">#DT003</span>
              <span className="order-amount">R0.00</span>
              <span className="order-status order-pending">Pending</span>
            </div>
          </div>
        </div>

        {/* Store Overview */}
        <div className="content-card">
          <h3 className="store-overview-title">Store Overview</h3>

          <p className="store-details-label">Store Status</p>

          <h2 className="store-overview-status">Active</h2>

          <small className="store-overview-text">
            Ready to accept incoming food orders
          </small>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
