require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 8081
const stripe = require("stripe")(`${process.env.API_KEY}`);
const storeItems = new Map(
  [[1, { price: 109.95 }],
  [
    2,
    {
      price: 22.3,
    },
  ],
  [
    3,
    {
      price: 55.99,
    },
  ],
  [
    4,
    {
      price: 15.99,
    },
  ],
  [
    5,
    {
      price: 695,
    },
  ],
  [
    6,
    {
      price: 168,
    },
  ],
  [
    7,
    {
      price: 9.99,
    },
  ],
  [
    8,
    {
      price: 10.99,
    },
  ],
  [
    9,
    {
      price: 64,
    },
  ],
  [
    10,
    {
      price: 109,
    },
  ],
  [
    11,
    {
      price: 109,
    },
  ],
  [
    12,
    {
      price: 114,
    },
  ],
  [
    13,
    {
      price: 599,
    },
  ],
  [
    14,
    {
      price: 999.99,
    },
  ],
  [
    15,
    {
      price: 56.99,
    },
  ],
  [
    16,
    {
      price: 29.95,
    },
  ],
  [
    17,
    {
      price: 39.99,
    },
  ],
  [
    18,
    {
      price: 9.85,
    },
  ],
  [
    19,
    {
      price: 7.95,
    },
  ],
  [
    20,
    {
      price: 12.99,
    },
  ]]
);
app.get('/',(req,res)=>{
    res.send('hello')
})
app.post("/", async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: req.body.products.map(item => {
          const storeItem = storeItems.get(item.id)
          console.log(storeItem)
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.title,
              },
              unit_amount: storeItem.price * 100,
            },
            quantity: item.quantity,
          }
        }),
        success_url: `http://localhost:3000/`,
        cancel_url: `http://localhost:3000/`,
      })
      res.json({ url: session.url })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
  
  app.listen(PORT,()=>{
    console.log('working')
  })
