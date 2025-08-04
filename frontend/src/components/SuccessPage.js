import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

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

      <div>
        <button
          style={{ marginTop: 20, padding: 10, color: "blue" }}
          onClick={() => (window.location.href = "/")}
        >
          Go to store page
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
