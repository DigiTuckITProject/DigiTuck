import React, { useState } from "react";

function Orders() {
  // Sample orders for testing the page
  const [orders, setOrders] = useState([
    {
      id: "DT001",
      customer: "John Smith",
      date: "06 Nov 2026",
      total: 150.0,
      status: "Pending",
    },
    {
      id: "DT002",
      customer: "Sarah Jones",
      date: "06 Nov 2026",
      total: 85.0,
      status: "Processing",
    },
    {
      id: "DT003",
      customer: "Peter Brown",
      date: "05 Nov 2026",
      total: 210.0,
      status: "Completed",
    },
  ]);

  // updates the status of an order
  const handleStatusChange = (id, newStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order,
      ),
    );
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Orders</h1>
        <p>View and manage customer orders.</p>
      </div>

      {/* table for orders*/}
      <div className="orders-table-card">
        <h2>Customer Orders</h2>

        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>

                  <td>{order.customer}</td>

                  <td>{order.date}</td>

                  <td>R{order.total.toFixed(2)}</td>

                  <td>
                    <span
                      className={`order-status ${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Orders;
