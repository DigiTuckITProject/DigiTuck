import React, { useState } from "react";

function Products() {
  // Stores the products displayed on the page
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Bread",
      category: "Bakery",
      price: 18.99,
      stock: 20,
      description: "Fresh white bread",
    },
    {
      id: 2,
      name: "Milk",
      category: "Dairy",
      price: 16.5,
      stock: 15,
      description: "1 litre fresh milk",
    },
    {
      id: 3,
      name: "Eggs",
      category: "Dairy",
      price: 35.0,
      stock: 10,
      description: "Tray of eggs",
    },
  ]);

  // Stores the values entered into the product form
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    image: "",
  });

  // Tracks whether the vendor is editing an existing product
  const [editingId, setEditingId] = useState(null);

  // Stores the product search input
  const [searchTerm, setSearchTerm] = useState("");

  // Updates form values whenever the vendor types
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  //handles product image uploads
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      //checks that the selected file is an image
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }

      //makes a temporary URL for the image
      const imageURL = URL.createObjectURL(file);

      //this saves the image URL in formData
      setFormData({
        ...formData,
        image: imageURL,
      });
    }
  };

  //adds a new product or updates an existing one
  const handleSubmit = (e) => {
    e.preventDefault();

    const productData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
    };

    if (editingId !== null) {
      // Update the selected product
      setProducts(
        products.map((product) =>
          product.id === editingId ? { ...product, ...productData } : product,
        ),
      );
    } else {
      //adds new product to the product list
      const newProduct = {
        id: Date.now(),
        ...productData,
      };

      setProducts([...products, newProduct]);
    }

    //this resests/clears  the form after saving
    resetForm();
  };

  //clears the form and exits edit mode
  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      description: "",
      image: "",
    });

    setEditingId(null);
  };

  //loads a existing product into the form for editing
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      description: product.description,
      image,
    });

    setEditingId(product.id);
  };

  //this will delete a product from the list
  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (confirmed) {
      setProducts(products.filter((product) => product.id !== id));
    }
  };

  //filters the products according to the search input
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="products-page">
      {/* page heading */}
      <div className="products-header">
        <div>
          <h1>Products</h1>
          <p>Manage your store inventory and products.</p>
        </div>
      </div>

      {/* product form */}
      <div className="product-form-card">
        <h3>{editingId !== null ? "Edit Product" : "Add New Product"}</h3>

        <form onSubmit={handleSubmit}>
          {/*product name */}
          <div className="form-group">
            <label>Product Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/*Product category */}
          <div className="form-group">
            <label>Category</label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              <option value="Bakery">Bakery</option>
              <option value="Fast-Food">-Fast-Food</option>
              <option value="Dairy">Dairy</option>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
              <option value="Groceries">Groceries</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* product price */}
          <div className="form-group">
            <label>Selling Price (R)</label>

            <input
              type="number"
              name="price"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          {/* available stock */}
          <div className="form-group">
            <label>Stock Quantity</label>

            <input
              type="number"
              name="stock"
              placeholder="Enter quantity"
              min="0"
              step="1"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>

          {/* Product description */}
          <div className="form-group">
            <label>Description</label>

            <textarea
              name="description"
              placeholder="Describe your product"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/*Product image upload */}
          <div className="form-group">
            <label>Product Image</label>

            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          {/*displays image preview */}
          {formData.image && (
            <div className="image-preview">
              <p>Image Preview:</p>

              <img src={formData.image} alt="Product preview" />
            </div>
          )}

          {/*form action buttons */}
          <div className="form-buttons">
            <button type="submit" className="save-product-btn">
              {editingId !== null ? "Update Product" : "Add Product"}
            </button>

            {editingId !== null && (
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/*product inventory */}
      <div className="inventory-section">
        <div className="inventory-header">
          <div>
            <h2>Product Inventory</h2>
            <p>{products.length} products listed</p>
          </div>

          {/*search products */}
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/*display filtered products */}
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div className="product-card" key={product.id}>
                <div className="product-card-info">
                  {/* Display product image */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-card-image"
                    />
                  ) : (
                    <div className="no-product-image">No Image</div>
                  )}
                  <span className="product-category">{product.category}</span>

                  <h3>{product.name}</h3>

                  <p>{product.description}</p>

                  <h2>R{product.price.toFixed(2)}</h2>

                  <p>Stock: {product.stock}</p>

                  <span
                    className={
                      product.stock > 0
                        ? "stock-available"
                        : "stock-unavailable"
                    }
                  >
                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                {/*edit and delete buttons */}
                <div className="product-actions">
                  <button
                    onClick={() => handleEdit(product)}
                    className="edit-btn"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
