require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Platform takes 10%, connected account gets 90%
const PLATFORM_FEE_PERCENT = 10;

app.post("/create-checkout-session", async (req, res) => {
  const { product, connectedAccountId } = req.body;

  if (!connectedAccountId) {
    return res.status(400).json({ error: "Connected account ID is required" });
  }

  try {
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
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(
          product.price * (PLATFORM_FEE_PERCENT / 100)
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
