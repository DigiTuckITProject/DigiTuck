import React from "react";

// side bar components in vendor navigationn
function Sidebar({ activePage, onNavigate }) {
  const menuItems = [
    //menu items displayed in sidebar
    { name: "Dashboard" },
    { name: "Products" },
    { name: "Orders" },
    { name: "Store Profile" },
    { name: "Settings" },
  ];

  return (
    // the main sidebar container
    <aside className="vendor-sidebar">
      <div className="sidebar-brand">
        <h2>DigiTuck</h2>
        <p>VENDOR PORTAL</p>
      </div>

      {/** the navigation menu */}
      <div className="sidebar-menu">
        <p className="menu-heading">MENU</p>

        {/*each menu item will be displyed as a button*/}
        {menuItems.map(
          (
            item, // will loop through every item inside the menuItems array
          ) => (
            <button
              key={item.name} // each button will have a uniqye key using its name
              className={`sidebar-link ${
                // if buttonmatches the active pahe then it aslo adds the active class
                activePage === item.name ? "active" : ""
              }`}
              // when the user click sthe button, it calls onNavigate  and passes the selected items name.
              onClick={() => onNavigate(item.name)}
            >
              {item.name} {/* displays the menu item names */}
            </button>
          ),
        )}
      </div>

      <div className="sidebar-footer">
        <p>Vendor Account</p>
        <small>DigiTuck Marketplace</small>
      </div>
    </aside>
  );
}

export default Sidebar;
