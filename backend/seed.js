const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./db");
const Book = require("./models/Book");

dotenv.config();
connectDB();

const seedBooks = async () => {
  await Book.deleteMany();

  const books = [
    {
      title: "Fiction Stories",
      authors: ["John Smith"],
      description: "A collection of fascinating fictional stories.",
      categories: ["fiction"],
      coverUrl: "book.png",
      pdfUrl: "books/fiction.pdf"
    },
    {
      title: "Motivation Guide",
      authors: ["Jane Doe"],
      description: "Your guide to daily motivation and success.",
      categories: ["motivation"],
      coverUrl: "book.png",
      pdfUrl: "books/motivation.pdf"
    },
    {
      title: "Tech Insights",
      authors: ["Alex Dev"],
      description: "A book about the latest in tech.",
      categories: ["tech"],
      coverUrl: "book.png",
      pdfUrl: "books/tech.pdf"
    },
    {
      title: "Recipes",
      authors: ["Chef Cook"],
      description: "Delicious recipes for every occasion.",
      categories: ["recipes"],
      coverUrl: "book.png",
      pdfUrl: "books/recipes.pdf"
    },
    {
      title: "Science Wonders",
      authors: ["Dr. Science"],
      description: "Explore the wonderful world of science.",
      categories: ["science"],
      coverUrl: "book.png",
      pdfUrl: "books/science.pdf"
    }
  ];

  await Book.insertMany(books);
  console.log("✅ Books seeded successfully");
  process.exit();
};

seedBooks();
