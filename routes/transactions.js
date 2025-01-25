const express = require("express");
const router = express.Router();
const Transaction = require("../models/transaction");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/transaction", authMiddleware, async (req, res) => {
  try {
    const { type, category, value, dateTransition, description } = req.body;

    const transaction = new Transaction({
      type,
      category,
      value,
      dateTransition,
      description,
      user: res.locals.token,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: res.locals.token });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Transação deletada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/totals", authMiddleware, async (req, res) => {
  try {
    const totalReceitas = await Transaction.aggregate([
      { $match: { type: "receita" } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);

    const totalDespesas = await Transaction.aggregate([
      { $match: { type: "despesa" } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);

    res.json({
      totalReceitas: totalReceitas.length > 0 ? totalReceitas[0].total : 0,
      totalDespesas: totalDespesas.length > 0 ? totalDespesas[0].total : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/totals/balance", authMiddleware, async (req, res) => {
  try {
    const totalReceitas = await Transaction.aggregate([
      { $match: { type: "receita" } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);

    const totalDespesas = await Transaction.aggregate([
      { $match: { type: "despesa" } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);

    const totalBalance = totalReceitas[0].total - totalDespesas[0].total;

    res.json({
      totalBalance: totalBalance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/report/monthly", authMiddleware, async (req, res) => {
  try {
    const monthlyReceitas = await Transaction.aggregate([
      {
        $project: {
          type: 1,
          value: 1,
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
      },
      { $match: { type: "receita" } },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalReceitas: { $sum: "$value" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyDespesas = await Transaction.aggregate([
      {
        $project: {
          type: 1,
          value: 1,
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
      },
      { $match: { type: "despesa" } },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalDespesas: { $sum: "$value" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyReport = monthlyReceitas.map((receita) => {
      const despesas = monthlyDespesas.find(
        (despesa) =>
          despesa._id.year === receita._id.year &&
          despesa._id.month === receita._id.month
      );

      const saldo =
        receita.totalReceitas - (despesas ? despesas.totalDespesas : 0);

      return {
        year: receita._id.year,
        month: receita._id.month,
        totalReceitas: receita.totalReceitas,
        totalDespesas: despesas ? despesas.totalDespesas : 0,
        saldo: saldo,
      };
    });

    res.json(monthlyReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/report/annual", authMiddleware, async (req, res) => {
  try {
    const annualDespesas = await Transaction.aggregate([
      {
        $project: {
          type: 1,
          value: 1,
          year: { $year: "$date" },
        },
      },
      { $match: { type: "despesa" } },
      {
        $group: {
          _id: { year: "$year" },
          totalDespesas: { $sum: "$value" },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);

    const annualReport = annualReceitas.map((receita) => {
      const despesas = annualDespesas.find(
        (despesa) => despesa._id.year === receita._id.year
      );

      const saldo =
        receita.totalReceitas - (despesas ? despesas.totalDespesas : 0);

      return {
        year: receita._id.year,
        totalReceitas: receita.totalReceitas,
        totalDespesas: despesas ? despesas.totalDespesas : 0,
        saldo: saldo,
      };
    });

    res.json(annualReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
