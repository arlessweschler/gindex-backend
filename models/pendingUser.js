const mongoose = require('mongoose');

// Pending User Database Model
const pendingUserSchema = {
	name: {
    type: String,
    required: true
  },
	post: {
    type: String,
    required: true
  },
	email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true },
	message: {
    type: String
  }
};

const PendingUser = mongoose.model("PendingUser", pendingUserSchema);

module.exports = PendingUser;
