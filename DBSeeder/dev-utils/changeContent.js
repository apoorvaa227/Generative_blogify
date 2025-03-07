import { configDotenv } from "dotenv";
import * as path from "path";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Blog from "../../models/blog";
import connectDB from "../../db/connect";

const newPath = path.join(__dirname, "..", "..", ".env");
configDotenv({ path: newPath });

const changeContent = async () => {
  try {
    // Connect to the database
    const db = await connectDB(process.env.MONGO_URL);

    // Fetch all blogs with 'content' field
    const blogs = await Blog.find({}).select("content");

    for (let blog of blogs) {
      // Ignore blogs with specific ID pattern
      if (blog._id.toString().slice(0, 8) !== "bbbbbbbb") {
        console.log(blog._id);

        // Parse and restructure content
        const text = JSON.parse(blog.content)
          .blocks.map((block) => block.data.text)
          .join("\n\n");

        blog.content = JSON.stringify({
          time: Date.now(),
          blocks: text.split("\n\n").map((paragraph) => ({
            id: uuidv4(),
            type: "paragraph",
            data: { text: paragraph.trim() },
          })),
          version: "2.8.1",
        });

        // Save the updated blog
        await blog.save();
      }
    }

    // Close the database connection
    mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
};

// Execute the function
changeContent();

