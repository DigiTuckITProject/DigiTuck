import React, { useState } from "react";

function AdminSettings() {
  const [settings, setSettings] = useState({
    name: "DigiTuck Admin",
    email: "admin@digituck.co.za",
    password: "",
    confirmPassword: "",
  });

  // Update form values
  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  // Save account settings
  const handleSubmit = (e) => {
    e.preventDefault();

    if (settings.password !== settings.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert("Settings saved successfully.");
  };

  return (
    <div className="admin-settings">
      <div className="admin-page-header">
        <div>
          <h1>Admin Settings</h1>
          <p>Manage your administrator account details.</p>
        </div>
      </div>

      <div className="admin-settings-card">
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={settings.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-group">
            <label>New Password</label>
            <input
              type="password"
              name="password"
              value={settings.password}
              onChange={handleChange}
              placeholder="Enter new password"
            />
          </div>

          <div className="admin-form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={settings.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" className="admin-save-btn">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminSettings;
