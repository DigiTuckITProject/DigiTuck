import React, { useState } from "react";

function UserManagement() {
  // Sample user data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john@gmail.com",
      role: "Customer",
      status: "Active",
    },
    {
      id: 2,
      name: "Sarah Mokoena",
      email: "sarah@gmail.com",
      role: "Vendor",
      status: "Active",
    },
    {
      id: 3,
      name: "Peter James",
      email: "peter@gmail.com",
      role: "Customer",
      status: "Inactive",
    },
    {
      id: 4,
      name: "Mary Brown",
      email: "mary@gmail.com",
      role: "Vendor",
      status: "Active",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Activate or deactivate a user
  const handleStatusChange = (id) => {
    setUsers(
      users.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === "Active" ? "Inactive" : "Active",
            }
          : user,
      ),
    );
  };

  // Search and filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "All" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-users">
      <div className="admin-page-header">
        <div>
          <h1>User Management</h1>
          <p>View and manage registered DigiTuck accounts.</p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="admin-user-controls">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Users</option>
          <option value="Customer">Customers</option>
          <option value="Vendor">Vendors</option>
        </select>
      </div>

      {/* Users table */}
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Account Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span
                      className={`admin-status ${user.status.toLowerCase()}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-action-btn"
                      onClick={() => handleStatusChange(user.id)}
                    >
                      {user.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;
