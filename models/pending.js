const mongoose = require("mongoose");

const pendingSchema = new mongoose.Schema(
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
    },
    { timestamps: true }
  );

const Pending = mongoose.model("Pending", pendingSchema);

exports.Pending = Pending;