require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Platform takes 10%, connected account gets 90%
const PLATFORM_FEE_PERCENT = 10;

// Sample coupon codes (in a real app, this would be in a database)
const COUPON_CODES = {
  SAVE10: { discount: 10, type: "percentage" },
  SAVE20: { discount: 20, type: "percentage" },
};

app.post("/validate-coupon", async (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    return res.status(400).json({ error: "Coupon code is required" });
  }

  const coupon = COUPON_CODES[couponCode.toUpperCase()];

  if (!coupon) {
    return res.json({ valid: false, message: "Invalid coupon code" });
  }

  res.json({
    valid: true,
    discount: coupon.discount,
    type: coupon.type,
    message: "Coupon applied successfully",
  });
});

app.post("/create-checkout-session", async (req, res) => {
  const { product, connectedAccountId, couponCode, discount = 0 } = req.body;

  if (!connectedAccountId) {
    return res.status(400).json({ error: "Connected account ID is required" });
  }

  try {
    // Calculate final price after discount
    let finalPrice = product.price;
    if (couponCode && discount > 0) {
      const coupon = COUPON_CODES[couponCode.toUpperCase()];
      if (coupon) {
        if (coupon.type === "percentage") {
          finalPrice = Math.round(product.price * (1 - coupon.discount / 100));
        } else {
          finalPrice = Math.max(0, product.price - coupon.discount * 100); // Convert to cents
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: product.name,
              images: [product.image],
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(
          finalPrice * (PLATFORM_FEE_PERCENT / 100)
        ),
        transfer_data: {
          destination: connectedAccountId,
        },
      },
      mode: "payment",
      success_url:
        "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000?canceled=true",
    });

    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/get-session/:id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.send(session);
  } catch (err) {
    res.status(400).send({ error: "Invalid session ID" });
  }
});

app.listen(5000, () => console.log("Server running at http://localhost:5000"));
