const blogs = require("./data.json");
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const maxUsersToPush = 200;

function replaceSingleQuotesWithDoubleQuotes(inputString) 
{
    return inputString.replace(/'/g, '"');
}
function randomInt(a, b) 
{
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function convertNumberToId(number, userOrBlog = "user") 
{
    let startHex = "aaaaaaaaaaaaaaaaaaaaaaaa";
    if (userOrBlog === "blog") startHex = "bbbbbbbbbbbbbbbbbbbbbbbb";
    if (userOrBlog === "comment") startHex = "cccccccccccccccccccccccc";

    return new mongoose.Types.ObjectId(
        startHex.slice(0, 24 - number.toString().length) + number
    );
}

console.log("Generating data...");
let userIdName = new Map();
userIdName.set("Hello", convertNumberToId(1, "user"));
let tags = new Set();

console.time("executionTime");

const filteredBlogs = blogs
    .map((blog, index) => {
        let { title, text, authors, tags } = blog;

        let authorArray = replaceSingleQuotesWithDoubleQuotes(authors);
        authors = JSON.parse(authorArray);

        let tagsArray = replaceSingleQuotesWithDoubleQuotes(tags);
        tags = JSON.parse(tagsArray).map((tag) => tag.toLowerCase());

        const content = JSON.stringify({
            time: 1550476186479,
            blocks: text.split("\n\n").map((paragraph) => ({
                id: faker.string.uuid(),
                type: "paragraph",
                data: { text: paragraph.trim() },
            })),
            version: "2.8.1",
        });

        return {
            _id: convertNumberToId(index + 1, "blog"),
            title,
            description: text.slice(0, randomInt(200, 250)),
            content,
            img: `https://picsum.photos/id/${randomInt(10, 1000)}/300/200`,
            author: authors[0] || null,
            tags,
            views: 0,
            likes: [],
            likesCount: 0,
            comments: [],
            commentsCount: 0,
            createdAt: faker.date.past(),
        };
    })
    .filter((blog) => {
        if (!blog.title || blog.title.length < 6 || blog.title.length > 100) return false;
        if (!blog.author || blog.author.length < 3) return false;

        if (userIdName.size >= maxUsersToPush) {
            const randomAuthor = Array.from(userIdName.values())[randomInt(0, userIdName.size - 1)];
            blog.author = randomAuthor;
        } else {
            if (!userIdName.has(blog.author)) {
                userIdName.set(blog.author, convertNumberToId(userIdName.size + 1, "user"));
            }
            blog.author = userIdName.get(blog.author);
        }

        blog.tags.forEach((tag) => tags.add(tag.toLowerCase()));
        return true;
    });

console.timeLog("executionTime", "Filtering blogs");

const tagArray = [...tags];
const randomComments = [
    "I don't agree with this", "I agree with this", "This is a great article", "This is a bad article",
    "I don't understand this", "This is too complicated", "This is too simple", "I like this",
];
const bioData = [
    "Passionate about technology and innovation.",
    "Creative thinker with a keen eye for design.",
    "Experienced in web development.",
    "Fascinated by artificial intelligence.",
    "Committed to delivering high-quality software.",
];

const userData = [];
const blogData = filteredBlogs;
const commentData = [];

console.timeLog("executionTime", "Variables created");

for (let [name, id] of userIdName) {
    let readArticles = [];
    for (let i = 0; i < randomInt(20, 100); i++) {
        const randomBlog = blogData[randomInt(0, blogData.length - 1)];
        commentData.push({
            _id: convertNumberToId(commentData.length + 1, "comment"),
            message: randomComments[randomInt(0, randomComments.length - 1)],
            author: id,
        });
        randomBlog.views += 1;
        readArticles.push(randomBlog._id);
        randomBlog.comments.push(commentData[commentData.length - 1]);
        randomBlog.commentsCount++;
    }

    for (let i = 0; i < randomInt(50, 1000); i++) {
        const randomBlog = blogData[randomInt(0, blogData.length - 1)];
        randomBlog.views += 1;
        readArticles.push(randomBlog._id);
        randomBlog.likes.push(id);
        randomBlog.likesCount++;
    }

    let myBlogs = blogData
        .filter((blog) => blog.author === id)
        .map((blog) => blog._id);

    let myInterests = [];
    for (let i = 0; i < randomInt(1, 5); i++) {
        myInterests.push(tagArray[randomInt(0, tagArray.length - 1)]);
    }

    userData.push({
        _id: id,
        name,
        email: faker.internet.email({ firstName: name }),
        password: bcrypt.hashSync("password", 5),
        profileImage: faker.image.avatar(),
        bio: bioData[randomInt(0, bioData.length - 1)],
        blogs: myBlogs,
        myInterests,
        readArticles,
        following: [],
        followers: [],
    });
}

console.timeLog("executionTime", "User data created");

userData[0].email = "hello@hello.com";
userData[0].password = bcrypt.hashSync("hello@hello.com", 10);

for (let user of userData) {
    for (let i = 0; i < randomInt(2, 100); i++) {
        const randomUser = userData[randomInt(0, userData.length - 1)];
        user.following.push(randomUser._id);
        randomUser.followers.push(user._id);
    }
}

console.timeLog("executionTime", "Followers and following created");
console.log("Data generated");
console.timeEnd("executionTime");

module.exports = { blogData, userData, commentData };
