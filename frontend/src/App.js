import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";

const stripePromise = loadStripe(
  "pk_test_51RrHzHFZJKRsakgbD6XKC0d1dKHOQlyJSA2MuiP7qvU3xBtyzlTCcOuI7PCBWaCd9iz7Vceak1x3KSvGEMXBgrBQ00j7BygSf7"
);

const ProductStore = () => {
  const [products, setProducts] = useState([]);
  const [connectedAccountId, setConnectedAccountId] = useState("");

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

  const handleCheckout = async (product) => {
    if (!connectedAccountId) {
      alert("Seller account not configured. Please try again later.");
      return;
    }

    const stripe = await stripePromise;

    try {
      const res = await axios.post(
        "http://localhost:5000/create-checkout-session",
        {
          product,
          connectedAccountId,
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
              onClick={() => handleCheckout(product)}
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

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setPaymentStatus("denied");
      return;
    }

    axios
      .get(`http://localhost:5000/get-session/${sessionId}`)
      .then((res) => {
        if (res.data.payment_status === "paid") {
          setPaymentStatus("success");
          setPaymentDetails({
            amount: res.data.amount_total / 100,
            currency: res.data.currency,
            paymentIntent: res.data.payment_intent,
          });
        } else {
          setPaymentStatus("denied");
        }
      })
      .catch(() => setPaymentStatus("denied"));
  }, [sessionId]);

  if (paymentStatus === "loading")
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h2>🔄 Verifying payment...</h2>
      </div>
    );

  if (paymentStatus === "denied")
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h2>❌ Payment Not Completed</h2>
        <p>Please try your purchase again.</p>
      </div>
    );

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>✅ Payment Successful</h1>
      <p>Thank you for your purchase!</p>
      {paymentDetails && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            backgroundColor: "#f8f9fa",
            display: "inline-block",
            borderRadius: 8,
          }}
        >
          <p>
            <strong>Amount Paid:</strong> ₹{paymentDetails.amount}
          </p>
          <p>
            <strong>Transaction ID:</strong> {paymentDetails.paymentIntent}
          </p>
          <p>
            <small>10% platform fee deducted, 90% sent to seller</small>
          </p>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductStore />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
