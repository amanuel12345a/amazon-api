const express = require('express')
const router = express.Router()
router.post(
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
              if(products){
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
              }
              console.log(product)
              console.log(pending)
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
  exports.router = router