import React, { useState } from "react";

function StoreProfile() {
  //Stores the vendor's store information
  const [storeData, setStoreData] = useState({
    storeName: "Mary's Tuckshop",
    description: "Your local store for everyday essentials.",
    phone: "0712345678",
    address: "Randburg, Johannesburg",
    openingTime: "07:00",
    closingTime: "18:00",
  });

  //Updates the information when the vendor types
  const handleChange = (e) => {
    const { name, value } = e.target;

    setStoreData({
      ...storeData,
      [name]: value,
    });
  };

  //this handles saving the store information
  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Store information saved successfully!");
  };

  return (
    <div className="store-profile-page">
      <div className="store-profile-header">
        <h1>Store Profile</h1>
        <p>Manage your store information.</p>
      </div>

      {/*stores information form */}
      <div className="store-profile-card">
        <h2>Store Information</h2>

        <form onSubmit={handleSubmit}>
          {/* Store name */}
          <div className="form-group">
            <label>Store Name</label>
            <input
              type="text"
              name="storeName"
              value={storeData.storeName}
              onChange={handleChange}
              required
            />
          </div>

          {/*store description */}
          <div className="form-group">
            <label>Store Description</label>
            <textarea
              name="description"
              value={storeData.description}
              onChange={handleChange}
            />
          </div>

          {/*contact number */}
          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="phone"
              value={storeData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/*store address */}
          <div className="form-group">
            <label>Store Address</label>
            <input
              type="text"
              name="address"
              value={storeData.address}
              onChange={handleChange}
              required
            />
          </div>

          {/*operating hours */}
          <div className="form-group">
            <label>Opening Time</label>
            <input
              type="time"
              name="openingTime"
              value={storeData.openingTime}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Closing Time</label>
            <input
              type="time"
              name="closingTime"
              value={storeData.closingTime}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="save-product-btn">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default StoreProfile;
