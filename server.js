require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { Order } = require("./models/order");
const { Pending } = require("./models/pending");
app.use(cors());
app.use(express.json());
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const PORT = process.env.PORT || 8081
const stripe = require("stripe")(`${process.env.API_KEY}`);
const ObjectId = require('mongoose').Types.ObjectId;
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
// webhook 
app.post("/order", async (req, res) => {
  const {userId} = req.body
  try {
    // const parsedCustomerId = new mongoose.Types.ObjectId();
    const orders = await Order.find({ userId: userId});
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_858e181bf262b217912cf02ea988107da4b478bed86494c67f6131140bd7cb6b";

app.use(bodyParser.raw({ type: 'application/json' }));

app.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (req, res) => {
    let data;
    let eventType;

    // Check if webhook signing is configured.
    let webhookSecret;
    //webhookSecret = process.env.STRIPE_WEB_HOOK;

    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed:  ${err}`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data.object;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data.object;
      eventType = req.body.type;
    }

    // Handle the checkout.session.completed event
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then(async (customer) => {
          try {
            // CREATE ORDER
            // console.log(data)
            const customerId = customer.metadata.id; // Assuming this is the customer's ID from Stripe
            const parsedCustomerId = new mongoose.Types.ObjectId(customerId);
            const pending = await Pending.find({ _id: parsedCustomerId });
            // console.log(pending)
            const {userId,products} = pending[0]
            console.log(userId)
            const product = products.map((product)=>{
              // console.log(product)
              return {
                quantity:product.quantity,
                image:product.image,
                title:product.title,
                price:product.price,
                category:product.category,
                description:product.description,
                productId: product.productId
              }
            })
            // console.log(product)
            // console.log(pending)
            const amount = data.amount_total
            const neworder = new Order({userId:userId, products:product,total:amount})
            // console.log(neworder)
            // createOrder(customer, data);
            const done = await neworder.save()
          } catch (err) {
            console.log(typeof createOrder);
            console.log(err);
          }
        })
        .catch((err) => console.log(err.message));
    }

    res.status(200).end();
  }
);
// iWPoLQcHjpr0tIHP
mongoose
  .connect('mongodb+srv://amanuel:amanuel@cluster0.yq02jmz.mongodb.net/?retryWrites=true&w=majority', )
  .then(() => console.log("MongoDB connection established..."))
  .catch((error) => console.error("MongoDB connection failed:", error.message));
app.post("/", async (req, res) => {
  // console.log(req.body)
  const products = req.body.products 
  const product = products.map((product)=>{
    // console.log(product)
    return {
      quantity:product.quantity,
      image:product.image,
      title:product.title,
      price:product.price,
      category:product.category,
      description:product.description,
      productId: product.id
    }
  })
  // console.log(product)
  const newpending = new Pending({userId: req.body.email,products:product})

  // console.log(newpending._id)
  const id = newpending._id
  const done = await newpending.save()
  const customer = await stripe.customers.create({
    metadata: {
      id: `${id}`
    }
    })
  // console.log(customer)
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: req.body.products.map(item => {
          const storeItem = storeItems.get(item.id)
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
        customer: customer.id,
        success_url: `http://localhost:3001/`,
        cancel_url: `https://amazon1-roan.vercel.app/`,
      })
      res.json({ url: session.url, products: req.body.products})
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
  
  app.listen(PORT,()=>{
    console.log('working')
  })
