import React, { useState } from "react";

function Settings() {
  //Stores the vendors account settings
  const [settings, setSettings] = useState({
    email: "vendor@example.com",
    password: "",
    notifications: true,
  });

  // updates the  settings when the vendor makes changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // handles saving settings
  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Settings saved successfully!");
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your vendor account preferences.</p>
      </div>

      <div className="settings-card">
        <h2>Account Settings</h2>

        <form onSubmit={handleSubmit}>
          {/* Vendor email */}
          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>New Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter a new password"
              value={settings.password}
              onChange={handleChange}
            />
          </div>

          {/* notification preference */}
          <div className="notification-setting">
            <label>
              <input
                type="checkbox"
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
              />
              Receive order notifications
            </label>
          </div>

          <button type="submit" className="save-product-btn">
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
