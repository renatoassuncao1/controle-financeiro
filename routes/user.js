require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const authMiddleware = require("../middleware/authMiddleware.js");

router.post("/register", async (req, res) => {
  try {
    const { fullName, cpf, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: "Email já cadastrado!",
      });
    }

    const existingCpf = await User.findOne({ cpf });
    if (existingCpf) {
      return res.status(400).json({
        error: "CPF já cadastrado!",
      });
    }

    const user = new User({
      fullName,
      cpf,
      email,
      password,
    });

    await user.save();
    res.status(201).json({ message: "Usuário cadastrado com sucesso" });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "Email ou senha incorretos",
      });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Email ou senha incorretos",
      });
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3600000,
    });

    res.status(200).json({
      message: "Login bem-sucedido",
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

module.exports = router;
