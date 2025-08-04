import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ProductStore = () => {
  const [products, setProducts] = useState([]);
  const [connectedAccountId, setConnectedAccountId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch products
    axios.get("https://fakestoreapi.com/products?limit=6").then((res) => {
      const formattedProducts = res.data.map((product) => ({
        id: product.id,
        name: product.title,
        price: Math.floor(product.price * 100),
        image: product.image,
      }));
      setProducts(formattedProducts);
    });

    setConnectedAccountId("acct_1RsHwHFJ8TvxI620");
  }, []);

  const handleBuyNow = (product) => {
    // Navigate to mediator page with product data
    navigate("/checkout-summary", {
      state: {
        product,
        connectedAccountId,
      },
    });
  };

  return (
    <div style={{ padding: 40 }}>
      <h2 style={{ textAlign: "center" }}>🛒 Product Store</h2>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <small>Platform fee: 10% | Seller receives: 90%</small>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          justifyContent: "center",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ccc",
              padding: 20,
              width: 250,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <img
                src={product.image}
                alt={product.name}
                width="100%"
                height={200}
                style={{ objectFit: "contain" }}
              />
              <h3>{product.name.slice(0, 40)}</h3>
              <p>₹{product.price / 100}</p>
            </div>
            <button
              onClick={() => handleBuyNow(product)}
              style={{
                padding: "10px 15px",
                backgroundColor: "#6772e5",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductStore;
