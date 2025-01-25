const jwt = require("jsonwebtoken");
const validator = require("validator");
require("dotenv").config();

const validateCookie = (req) => {
  const token = req.cookies.token;

  return token || false;
};

const validateString = (token) => {
  return validator.isJWT(token);
};

const validateJwt = (req) => {
  const token = validateCookie(req);

  if (!token) {
    return false;
  }

  if (!validateString(token)) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded.id;
  } catch (error) {
    console.error("Erro ao validar o JWT:", error.message);
    return false;
  }
};

module.exports = validateJwt;
