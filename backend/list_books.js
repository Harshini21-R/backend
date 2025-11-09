const connectDB = require('./db');
const dotenv = require('dotenv');
const Book = require('./models/Book');
dotenv.config();

(async ()=>{
  try{
    await connectDB();
    const books = await Book.find().lean();
    console.log('Books:');
    books.forEach(b=>console.log(b._id, b.title, '->', b.pdfPath));
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
