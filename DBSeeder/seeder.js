
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const BlogModel = require("./blog");
const UserModel = require("./user");
const CommentModel = require("./comment");
const { blogData, userData, commentData } = require("./dataGenerator");

// Environment variables load karna
dotenv.config("../.env");

// MongoDB connection ke liye timeout set karna
const serverSelectionTimeoutMS = Number(process.env.SERVER_SELECTION_TIMEOUT_MS) || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS,
  })
  .then(seeder) // Seeder function call karna jab connection successful ho
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Seeder function ka kaam: database clean karke naya data insert karna
async function seeder() {
  console.log("Connected to MongoDB");
  await userSeeder(); // User-related data seed karna
  await commentSeeder(); // Comment-related data seed karna
  await blogSeeder(); // Blog-related data seed karna
  mongoose.connection.close(); // Connection close karna after all operations
}

// Blog data seeding
async function blogSeeder() {
  try {
    await BlogModel.deleteMany({}); // Purana blog data delete karna
    console.log("Old blog data deleted successfully.");
  } catch (error) {
    console.error("Error deleting old blog data:", error.message);
  }

  try {
    await BlogModel.insertMany(blogData); // Naya blog data insert karna
    console.log("All blog data inserted successfully.");
  } catch (error) {
    console.error("Error inserting blog data:", error.message);
  }
}

// User data seeding
async function userSeeder() {
  try {
    await UserModel.deleteMany({}); // Purana user data delete karna
    console.log("Old user data deleted successfully.");
  } catch (error) {
    console.error("Error deleting old user data:", error);
  }

  try {
    await UserModel.insertMany(userData); // Naya user data insert karna
    console.log("All user data inserted successfully.");
  } catch (error) {
    console.error("Error inserting user data:", error.message);
  }
}

// Comment data seeding
async function commentSeeder() {
  try {
    await CommentModel.deleteMany({}); // Purana comment data delete karna
    console.log("Old comment data deleted successfully.");
  } catch (error) {
    console.error("Error deleting old comment data:", error);
  }

  try {
    await CommentModel.insertMany(commentData); // Naya comment data insert karna
    console.log("All comment data inserted successfully.");
  } catch (error) {
    console.error("Error inserting comment data:", error.message);
  }
}
