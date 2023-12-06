const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the user schema
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: String,
  lastName: String,
  password: String,
  job: String,
  location: String,
  about: String,
  gmail: String,
  phone: String,
  instagram: String,
  twitter: String,
  experience: [
    {
      position: String,
      company: String,
      years: String,
      description: String,
    },
  ],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// Create a User model based on the schema
const User = mongoose.model('User', userSchema);

// Export the User model for use in other parts of your application
module.exports = User;
