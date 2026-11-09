import React, { useState } from "react";

function VendorVerification() {
  // Sample vendor applications
  const [vendors, setVendors] = useState([
    {
      id: 1,
      owner: "Sarah Mokoena",
      business: "Sarah's Tuckshop",
      email: "sarah@gmail.com",
      address: "Johannesburg",
      document: "Submitted",
      status: "Pending",
    },
    {
      id: 2,
      owner: "Peter James",
      business: "Peter's Spaza",
      email: "peter@gmail.com",
      address: "Soweto",
      document: "Submitted",
      status: "Pending",
    },
  ]);

  // Approve or reject a vendor application
  const handleDecision = (id, decision) => {
    setVendors(
      vendors.map((vendor) =>
        vendor.id === id ? { ...vendor, status: decision } : vendor,
      ),
    );
  };

  return (
    <div className="admin-verification">
      <div className="admin-page-header">
        <div>
          <h1>Vendor Verification</h1>
          <p>Review vendor applications and registration documents.</p>
        </div>
      </div>

      <div className="vendor-applications">
        {vendors.map((vendor) => (
          <div className="vendor-application-card" key={vendor.id}>
            <div className="vendor-application-info">
              <h2>{vendor.business}</h2>
              <p>
                <strong>Owner:</strong> {vendor.owner}
              </p>
              <p>
                <strong>Email:</strong> {vendor.email}
              </p>
              <p>
                <strong>Address:</strong> {vendor.address}
              </p>
              <p>
                <strong>Registration Document:</strong> {vendor.document}
              </p>

              <p>
                <strong>Application Status:</strong>{" "}
                <span className={`admin-status ${vendor.status.toLowerCase()}`}>
                  {vendor.status}
                </span>
              </p>
            </div>

            {vendor.status === "Pending" && (
              <div className="vendor-application-actions">
                <button
                  className="approve-btn"
                  onClick={() => handleDecision(vendor.id, "Approved")}
                >
                  Approve
                </button>

                <button
                  className="reject-btn"
                  onClick={() => handleDecision(vendor.id, "Rejected")}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {vendors.length === 0 && <p>No vendor applications available.</p>}
      </div>
    </div>
  );
}

export default VendorVerification;
