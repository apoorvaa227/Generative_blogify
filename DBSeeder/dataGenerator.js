// Required modules
const blogs = require("./data.json");
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const maxUsersToPush = 200; // Limit for users to be added

// Utility function to replace single quotes with double quotes
function replaceSingleQuotesWithDoubleQuotes(inputString) {
    return inputString.replace(/'/g, '"');
}

// Utility function to generate a random integer between two values (inclusive)
function randomInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

// Function to convert a number into a unique MongoDB ObjectId-like string
function convertNumberToId(number, userOrBlog = "user") {
    let startHex = "aaaaaaaaaaaaaaaaaaaaaaaa";
    if (userOrBlog === "blog") startHex = "bbbbbbbbbbbbbbbbbbbbbbbb";
    if (userOrBlog === "comment") startHex = "cccccccccccccccccccccccc";

    return new mongoose.Types.ObjectId(
        startHex.slice(0, 24 - number.toString().length) + number
    );
}

// Example of generating user data
const users = Array.from({ length: maxUsersToPush }, (_, index) => {
    const userId = convertNumberToId(index + 1, "user");
    const password = faker.internet.password();
    return {
        id: userId,
        name: faker.name.fullName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        password: bcrypt.hashSync(password, 10),
        rawPassword: password // For debugging or seeding purposes
    };
});

// Example of generating blog data
const blogsData = Array.from({ length: maxUsersToPush }, (_, index) => {
    const blogId = convertNumberToId(index + 1, "blog");
    return {
        id: blogId,
        title: faker.lorem.words(randomInt(3, 7)),
        content: replaceSingleQuotesWithDoubleQuotes(faker.lorem.paragraphs(randomInt(2, 5))),
        authorId: users[randomInt(0, maxUsersToPush - 1)].id,
        createdAt: faker.date.past()
    };
});

// Logging sample data for verification
console.log(users.slice(0, 5)); // Log first 5 users
console.log(blogsData.slice(0, 5)); // Log first 5 blogs

// Example Error Handling (Customizable for your use case)
try {
    // Simulate database interaction or file write
    console.log("Simulating database save...");
    // Your database or file logic here
} catch (error) {
    console.error("An error occurred:", error.message);
}
