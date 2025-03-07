import { configDotenv } from "dotenv";
import * as path from "path";
import Blog from "../../models/blog";
import User from "../../models/user";
import connectDB from "../../db/connect";
import { Schema, Types } from "mongoose";

const newPath = path.join(__dirname, "..", "..", ".env");
configDotenv({ path: newPath });

const getBlogsByEachUser = async () => {
  try {
    // Connect to the database
    const db = await connectDB(process.env.MONGO_URL);

    // Fetch all blogs
    const blogs = await Blog.find({});

    // Group blogs by authors
    const blogsByAuthor = blogs.reduce((acc, blog) => {
      const author = blog.author.toString();
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {});

    // Sort authors by blog count (descending order)
    const sortedBlogsByAuthor = Object.entries(blogsByAuthor).sort(
      (a, b) => b[1] - a[1]
    );

    // Log top 5 authors
    console.log(sortedBlogsByAuthor.slice(0, 5));

    // Close the database connection
    mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
};

const changeBlogAuthor = async () => {
  try {
    // Connect to the database
    const db = await connectDB(process.env.MONGO_URL);

    // Fetch all blogs
    const blogs = await Blog.find({});

    // Update authorship of the first 40 blogs
    const blogsToUpdate = blogs.slice(0, 40);
    await Promise.all(
      blogsToUpdate.map(async (blog) => {
        blog.author = new Types.ObjectId("aaaaaaaaaaaaaaaaaaaaaaa1");
        await blog.save();
      })
    );

    // Find and update user with the new blogs
    const user = await User.findById("aaaaaaaaaaaaaaaaaaaaaaa1");
    if (!user) {
      console.log("User not found");
      process.exit(0);
    }

    const updatedBlogs = await Blog.find({ author: user._id });
    user.blogs = updatedBlogs.map((blog) => blog._id);
    await user.save();

    console.log("Author changed successfully");

    // Close the database connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
  }
};

// Execute the functions
getBlogsByEachUser();
changeBlogAuthor();
