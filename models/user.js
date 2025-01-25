const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  cpf: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.pre("save", async function (next) {
  this.password = await argon2.hash(this.password);
  next();
});

userSchema.methods.checkPassword = async function (password) {
  return await argon2.verify(this.password, password);
};

module.exports = mongoose.model("User", userSchema);
