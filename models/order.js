const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    products: [
        {
          productId: { type: String }, // You can use this field for your own identifier
          quantity: { type: Number, default: 1 },
          image: { type: String },
          title: { type: String },
          price: { type: Number },
          category: { type: String },
          description: { type: String },
        },
      ],
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

exports.Order = Order;