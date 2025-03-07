import { configDotenv } from "dotenv";
import * as path from "path";
import mongoose from "mongoose";
import Blog from "../../models/blog";
import connectDB from "../../db/connect";

const newPath = path.join(__dirname, "..", "..", ".env");
configDotenv({ path: newPath });

const changeTagsToLowerCase = async () => {
  try {
    // Connect to the database
    const db = await connectDB(process.env.MONGO_URL);

    // Fetch all blogs with 'tags' and 'title'
    const blogs = await Blog.find({}).select("tags title");

    for (let blog of blogs) {
      console.log(blog._id);

      // Truncate titles longer than 100 characters
      if (blog.title.length > 100) {
        blog.title = blog.title.slice(0, 100);
      }

      // Convert all tags to lowercase
      blog.tags = blog.tags.map((tag) => tag.toLowerCase());

      // Save the updated blog
      await blog.save();
    }

    // Close the database connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
  }
};

// Execute the function
changeTagsToLowerCase();

