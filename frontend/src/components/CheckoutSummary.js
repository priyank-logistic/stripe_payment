import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const stripePromise = loadStripe(
  "pk_test_51RrHzHFZJKRsakgbD6XKC0d1dKHOQlyJSA2MuiP7qvU3xBtyzlTCcOuI7PCBWaCd9iz7Vceak1x3KSvGEMXBgrBQ00j7BygSf7"
);

const CheckoutSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, connectedAccountId } = location.state || {};
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!product) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h2>❌ No product selected</h2>
        <button onClick={() => navigate("/")}>Back to Store</button>
      </div>
    );
  }

  const originalPrice = product.price / 100;
  const subtotal = originalPrice;
  const finalTotal = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/validate-coupon",
        {
          couponCode: couponCode.trim(),
        }
      );

      if (response.data.valid) {
        let discountAmount = 0;
        if (response.data.type === "percentage") {
          discountAmount = (subtotal * response.data.discount) / 100;
        } else {
          discountAmount = response.data.discount;
        }
        setDiscount(discountAmount);
        setCouponApplied(true);
      } else {
        alert("Invalid coupon code");
      }
    } catch (error) {
      alert("Error applying coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    const stripe = await stripePromise;

    try {
      const res = await axios.post(
        "http://localhost:5000/create-checkout-session",
        {
          product,
          connectedAccountId,
          couponCode: couponApplied ? couponCode : null,
          discount,
        }
      );

      await stripe.redirectToCheckout({
        sessionId: res.data.id,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error initiating checkout. Please try again.");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>
        📋 Order Summary
      </h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: 80,
              height: 80,
              objectFit: "contain",
              marginRight: 15,
            }}
          />
          <div>
            <h3 style={{ margin: 0 }}>{product.name}</h3>
            <p style={{ margin: 0, color: "#666" }}>Quantity: 1</p>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span>Product Price:</span>
            <span>₹{originalPrice}</span>
          </div>
          {couponApplied && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                color: "#28a745",
              }}
            >
              <span>Discount:</span>
              <span>-₹{discount}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "1.1em",
              borderTop: "1px solid #eee",
              paddingTop: 10,
            }}
          >
            <span>Total:</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>🎫 Apply Coupon Code</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
            disabled={couponApplied}
          />
          <button
            onClick={handleApplyCoupon}
            disabled={loading || couponApplied}
            style={{
              padding: "10px 20px",
              backgroundColor: couponApplied ? "#28a745" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: couponApplied ? "default" : "pointer",
            }}
          >
            {loading ? "Applying..." : couponApplied ? "Applied" : "Apply"}
          </button>
        </div>
        {couponApplied && (
          <p
            style={{
              color: "#28a745",
              fontSize: "0.9em",
              marginTop: 5,
            }}
          >
            ✓ Coupon applied successfully!
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            flex: 1,
          }}
        >
          Back to Store
        </button>
        <button
          onClick={handleProceedToPayment}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            flex: 1,
          }}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default CheckoutSummary;
