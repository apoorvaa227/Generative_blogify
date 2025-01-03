
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
dotenv = require("dotenv");
dotenv.config();

var UserSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Please Provide Name."], minlength: 3, maxlength: 50 },
    email: { type: String, required: [true, "Please provide email."], match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]*)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[a-zA-Z]{2,})$/, "Please provide valid email."], unique: true },
    password: { type: String, required: [true, "Please provide password."], minlength: 8 },
    bio: { type: String, maxlength: 150 },
    profileImage: { type: String, default: "https://res.cloudinary.com/blogmind/image/upload/v1/default_profile.png" },
    blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
    myInterests: [String],
    readArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("User", UserSchema);
