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
const webhookrouter = require('./routes/webhook') 

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
app.use('/',webhookrouter.router)

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.ENDPOINTSECRET;

app.use(bodyParser.raw({ type: 'application/json' }));


// iWPoLQcHjpr0tIHP
mongoose
  .connect(process.env.MONGODB )
  .then(() => console.log("MongoDB connection established..."))
  .catch((error) => console.error("MongoDB connection failed:", error.message));
app.post("/", async (req, res) => {
  // console.log(req.body)
  const products = await req.body.products 
  let product;
  if (typeof (products) !== 'undefined')
   {
    if(products.length > 0)
    {
      product = await products.map((product)=>{
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
    }
    const newpending = await new Pending({userId: req.body.email,products:product})

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
        success_url: `https://amanuelproject.vercel.app/order`,
        cancel_url: `https://amanuelproject.vercel.app/`,
      })
      return res.json({ url: session.url, products: req.body.products})
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
   }
     res.send('no items')

  // console.log(product)
  
  })
  
  app.listen(PORT,()=>{
    console.log('working')
  })
