const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["receita", "despesa"], required: true },
  category: { type: String, required: true },
  value: { type: Number, required: true },
  dateTransition: { type: Date },
  date: { type: Date, default: Date.now },
  description: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
