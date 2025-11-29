# Readify - Online Book Reading & Rental Platform

## 📌 Overview

**Readify** is a comprehensive full-stack web application that provides an online book reading and rental management system. The platform enables users to browse, read, rent books, and interact through reviews and ratings, while administrators manage the entire book catalog and rental operations.

### Key Features
- 🔐 **JWT-based Authentication** - Secure user registration and login
- 📚 **Book Management** - Browse, search, and read books online
- 💰 **Rental System** - Rent books with hourly pricing and extension capabilities
- ⭐ **Reviews & Ratings** - Share feedback and rate books
- 📖 **Reading History** - Track reading progress and history
- 👨‍💼 **Admin Dashboard** - Complete CRUD operations for books and rental management
- 📧 **Email Notifications** - Automated notifications for new books and rental status updates

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer (Gmail SMTP)

---

## 🔄 Complete Application Workflow

### User Journey Flow

```mermaid
flowchart TD
    Start([User Visits Readify]) --> Landing[Landing Page]
    Landing --> Choice{New User?}
    
    Choice -->|Yes| Signup[Sign Up Form]
    Choice -->|No| Login[Login Form]
    
    Signup --> CreateAccount[Create Account<br/>POST /api/auth/register]
    CreateAccount --> LoginPage[Redirect to Login]
    LoginPage --> Login
    
    Login --> Auth[Authenticate User<br/>POST /api/auth/login]
    Auth --> JWT[Receive JWT Token]
    JWT --> Dashboard[User Dashboard]
    
    Dashboard --> Actions{User Actions}
    
    Actions --> Browse[Browse Books<br/>GET /api/books]
    Actions --> MyRentals[View My Rentals<br/>GET /api/rentals/my-rentals]
    Actions --> History[Reading History<br/>GET /api/history]
    
    Browse --> BookDetails[Select Book<br/>GET /api/books/:id]
    BookDetails --> BookActions{Book Actions}
    
    BookActions --> Read[Read Book<br/>PDF Viewer]
    BookActions --> Rent[Rent Book]
    BookActions --> Review[Add Review<br/>POST /api/reviews]
    BookActions --> Rate[Add Rating<br/>POST /api/ratings]
    
    Rent --> RentalForm[Fill Rental Form<br/>Hours + Transaction ID]
    RentalForm --> SubmitRental[Submit Rental Request<br/>POST /api/rentals]
    SubmitRental --> PendingApproval[Status: Pending]
    
    PendingApproval --> AdminApproval{Admin Approves?}
    AdminApproval -->|Yes| ActiveRental[Status: Active<br/>Email Sent]
    AdminApproval -->|No| RejectedRental[Status: Rejected<br/>Email Sent]
    
    ActiveRental --> RentalActions{Rental Actions}
    RentalActions --> ReadRented[Read Rented Book]
    RentalActions --> ExtendRental[Request Extension<br/>PUT /api/rentals/extend/:id]
    
    ExtendRental --> ExtensionPending[Extension Status: Pending]
    ExtensionPending --> AdminExtension{Admin Approves?}
    AdminExtension -->|Yes| ExtensionApproved[Extension Approved<br/>Time Extended]
    AdminExtension -->|No| ExtensionRejected[Extension Rejected]
    
    Read --> UpdateHistory[Update Reading History<br/>POST /api/history]
    
    Review --> ReviewSaved[Review Saved to DB]
    Rate --> RatingCalculated[Average Rating Updated]
```

### Admin Workflow

```mermaid
flowchart TD
    AdminLogin[Admin Login] --> AdminDash[Admin Dashboard]
    
    AdminDash --> AdminActions{Admin Actions}
    
    AdminActions --> ManageBooks[Manage Books]
    AdminActions --> ManageRentals[Manage Rentals]
    AdminActions --> ManageExtensions[Manage Extensions]
    
    ManageBooks --> BookOps{Book Operations}
    BookOps --> AddBook[Add New Book<br/>POST /api/books]
    BookOps --> EditBook[Edit Book<br/>PUT /api/books/:id]
    BookOps --> DeleteBook[Delete Book<br/>DELETE /api/books/:id]
    BookOps --> ToggleRentable[Toggle Rentable Status<br/>PUT /api/rentals/toggle-rentable/:bookId]
    
    ManageRentals --> ViewPending[View Pending Rentals<br/>GET /api/rentals/pending]
    ViewPending --> RentalDecision{Decision}
    RentalDecision --> ApproveRental[Approve Rental<br/>PUT /api/rentals/approve/:id]
    RentalDecision --> RejectRental[Reject Rental<br/>PUT /api/rentals/reject/:id]
    
    ApproveRental --> SendApprovalEmail[Send Approval Email]
    RejectRental --> SendRejectionEmail[Send Rejection Email]
    
    ManageExtensions --> ViewExtensions[View Pending Extensions<br/>GET /api/rentals/pending-extensions]
    ViewExtensions --> ExtensionDecision{Decision}
    ExtensionDecision --> ApproveExtension[Approve Extension<br/>PUT /api/rentals/approve-extension/:id]
    ExtensionDecision --> RejectExtension[Reject Extension<br/>PUT /api/rentals/reject-extension/:id]
    
    ManageRentals --> ViewActive[View Active Rentals<br/>GET /api/rentals/active]
    ViewActive --> CheckExpiry[Auto-Check Expiry]
    CheckExpiry --> UpdateExpired[Update Expired Rentals]
```

---

## 🗄️ Database Schema & Relationships

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ REVIEW : writes
    USER ||--o{ RATING : gives
    USER ||--o{ HISTORY : has
    USER ||--o{ RENTAL : requests
    
    BOOK ||--o{ REVIEW : receives
    BOOK ||--o{ RATING : has
    BOOK ||--o{ HISTORY : tracked_in
    BOOK ||--o{ RENTAL : rented_as
    
    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        String role
        Date createdAt
    }
    
    BOOK {
        ObjectId _id PK
        String title
        Array authors
        String description
        String isbn
        String coverUrl
        String pdfUrl
        Array categories
        Date publishedDate
        Number averageRating
        Number ratingsCount
        Boolean isRentable
        Number rentPrice
        Date createdAt
    }
    
    RENTAL {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId bookId FK
        Number hours
        Number totalCost
        String transactionId
        String status
        String extensionStatus
        Number extensionHours
        Number extensionCost
        String extensionTransactionId
        Date startTime
        Date endTime
        Date createdAt
        Date updatedAt
    }
    
    REVIEW {
        ObjectId _id PK
        ObjectId bookId FK
        ObjectId user FK
        String comment
        Date createdAt
        Date updatedAt
    }
    
    RATING {
        ObjectId _id PK
        ObjectId user FK
        ObjectId book FK
        Number rating
        Date createdAt
        Date updatedAt
    }
    
    HISTORY {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId bookId FK
        Number currentPage
        Number totalPages
        Boolean isCompleted
        Date date
        Date createdAt
        Date updatedAt
    }
```

### Detailed Schema Definitions

#### 1. User Schema
```javascript
{
  _id: ObjectId,
  name: String (required, trimmed),
  email: String (required, unique, lowercase, trimmed),
  password: String (required, hashed with bcrypt, min 6 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date (default: Date.now)
}
```
**Indexes**: 
- `email` (unique)

**Methods**:
- `comparePassword(candidatePassword)` - Compare hashed passwords

---

#### 2. Book Schema
```javascript
{
  _id: ObjectId,
  title: String (required, trimmed),
  authors: [String],
  description: String,
  isbn: String,
  coverUrl: String,
  pdfUrl: String,
  categories: [String],
  publishedDate: Date,
  averageRating: Number (default: 0),
  ratingsCount: Number (default: 0),
  isRentable: Boolean (default: false),
  rentPrice: Number (default: 2), // INR per hour
  createdAt: Date (default: Date.now)
}
```

---

#### 3. Rental Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  bookId: ObjectId (ref: 'Book', required),
  hours: Number (required),
  totalCost: Number (required),
  transactionId: String (required), // UTR from payment
  status: String (enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending'),
  
  // Extension fields
  extensionStatus: String (enum: ['none', 'pending', 'rejected'], default: 'none'),
  extensionHours: Number,
  extensionCost: Number,
  extensionTransactionId: String,
  
  startTime: Date,
  endTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

#### 4. Review Schema
```javascript
{
  _id: ObjectId,
  bookId: ObjectId (ref: 'Book', required),
  user: ObjectId (ref: 'User', required),
  comment: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

---

#### 5. Rating Schema
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  book: ObjectId (ref: 'Book', required),
  rating: Number (required, min: 1, max: 5),
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes**: 
- Compound unique index on `(user, book)` - Prevents duplicate ratings

---

#### 6. History Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  bookId: ObjectId (ref: 'Book', required),
  currentPage: Number (default: 1),
  totalPages: Number (default: 0),
  isCompleted: Boolean (default: false),
  date: Date (default: Date.now),
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes**: 
- Compound unique index on `(userId, bookId)` - Prevents duplicate history entries

---

## 🔗 Relationship Types

### One-to-Many Relationships

1. **User → Reviews** (One-to-Many)
   - One user can write multiple reviews
   - Each review belongs to one user
   - Foreign Key: `Review.user` references `User._id`

2. **User → Ratings** (One-to-Many)
   - One user can give multiple ratings (different books)
   - Each rating belongs to one user
   - Foreign Key: `Rating.user` references `User._id`
   - Constraint: One user can rate one book only once (unique index)

3. **User → History** (One-to-Many)
   - One user can have multiple reading history entries
   - Each history entry belongs to one user
   - Foreign Key: `History.userId` references `User._id`

4. **User → Rentals** (One-to-Many)
   - One user can have multiple rental requests
   - Each rental belongs to one user
   - Foreign Key: `Rental.userId` references `User._id`

5. **Book → Reviews** (One-to-Many)
   - One book can have multiple reviews
   - Each review is for one book
   - Foreign Key: `Review.bookId` references `Book._id`

6. **Book → Ratings** (One-to-Many)
   - One book can have multiple ratings
   - Each rating is for one book
   - Foreign Key: `Rating.book` references `Book._id`

7. **Book → History** (One-to-Many)
   - One book can appear in multiple users' history
   - Each history entry is for one book
   - Foreign Key: `History.bookId` references `Book._id`

8. **Book → Rentals** (One-to-Many)
   - One book can be rented multiple times
   - Each rental is for one book
   - Foreign Key: `Rental.bookId` references `Book._id`

### Many-to-Many Relationships (via Junction)

1. **User ↔ Book** (via Review)
   - Users can review many books
   - Books can be reviewed by many users
   - Junction: `Review` table

2. **User ↔ Book** (via Rating)
   - Users can rate many books
   - Books can be rated by many users
   - Junction: `Rating` table

3. **User ↔ Book** (via History)
   - Users can read many books
   - Books can be read by many users
   - Junction: `History` table

4. **User ↔ Book** (via Rental)
   - Users can rent many books
   - Books can be rented by many users
   - Junction: `Rental` table

---

## 🛠️ Complete API Documentation

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/auth/register` | Register new user | ❌ | ❌ |
| POST | `/api/auth/login` | Login user and get JWT token | ❌ | ❌ |

**Request/Response Examples:**

```javascript
// POST /api/auth/register
Request: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
Response: {
  "token": "jwt_token_here",
  "user": { "_id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" }
}

// POST /api/auth/login
Request: {
  "email": "john@example.com",
  "password": "password123"
}
Response: {
  "token": "jwt_token_here",
  "user": { "_id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" }
}
```

---

### Book Routes (`/api/books`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/books` | Get all books | ❌ | ❌ |
| GET | `/api/books/:id` | Get single book by ID | ❌ | ❌ |
| POST | `/api/books` | Create new book (sends email to all users) | ✅ | ✅ |
| PUT | `/api/books/:id` | Update book | ✅ | ✅ |
| DELETE | `/api/books/:id` | Delete book | ✅ | ✅ |

---

### Rental Routes (`/api/rentals`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/rentals` | Create rental request | ✅ | ❌ |
| GET | `/api/rentals/my-rentals` | Get user's rentals | ✅ | ❌ |
| GET | `/api/rentals/pending` | Get pending rental requests | ✅ | ✅ |
| GET | `/api/rentals/active` | Get all active rentals | ✅ | ✅ |
| GET | `/api/rentals/pending-extensions` | Get pending extension requests | ✅ | ✅ |
| PUT | `/api/rentals/approve/:id` | Approve rental request | ✅ | ✅ |
| PUT | `/api/rentals/reject/:id` | Reject rental request (sends email) | ✅ | ✅ |
| PUT | `/api/rentals/extend/:id` | Request rental extension | ✅ | ❌ |
| PUT | `/api/rentals/approve-extension/:id` | Approve extension request | ✅ | ✅ |
| PUT | `/api/rentals/reject-extension/:id` | Reject extension request | ✅ | ✅ |
| PUT | `/api/rentals/toggle-rentable/:bookId` | Toggle book rentable status | ✅ | ✅ |
| DELETE | `/api/rentals/:id` | Delete rental | ✅ | ✅ |

**Rental Request Example:**
```javascript
// POST /api/rentals
Request: {
  "bookId": "book_id_here",
  "hours": 24,
  "transactionId": "UTR123456789"
}
Response: {
  "_id": "rental_id",
  "userId": "user_id",
  "bookId": "book_id",
  "hours": 24,
  "totalCost": 48, // 24 hours * 2 INR/hr
  "transactionId": "UTR123456789",
  "status": "pending",
  "extensionStatus": "none"
}
```

---

### Review Routes (`/api/reviews`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/reviews` | Add review for a book | ✅ | ❌ |
| GET | `/api/reviews/:bookId` | Get all reviews for a book | ❌ | ❌ |

---

### Rating Routes (`/api/ratings`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/ratings` | Add/update rating for a book | ✅ | ❌ |
| GET | `/api/ratings/:bookId` | Get all ratings for a book | ❌ | ❌ |

---

### History Routes (`/api/history`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/history` | Add/update reading history | ✅ | ❌ |
| GET | `/api/history` | Get user's reading history | ✅ | ❌ |

---

## 📂 Project Structure

```
readify_final/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── bookController.js      # Book CRUD operations
│   │   ├── historyController.js   # Reading history logic
│   │   ├── ratingController.js    # Rating operations
│   │   └── reviewController.js    # Review operations
│   ├── models/
│   │   ├── User.js                # User schema
│   │   ├── Book.js                # Book schema
│   │   ├── Rental.js              # Rental schema
│   │   ├── Review.js              # Review schema
│   │   ├── Rating.js              # Rating schema
│   │   └── History.js             # History schema
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints
│   │   ├── bookRoutes.js          # Book endpoints
│   │   ├── rentalRoutes.js        # Rental endpoints
│   │   ├── reviewRoutes.js        # Review endpoints
│   │   ├── ratingRoutes.js        # Rating endpoints
│   │   └── historyRoutes.js       # History endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   └── adminMiddleware.js     # Admin role check
│   ├── uploads/
│   │   └── pdfs/                  # Uploaded book PDFs
│   ├── .env                       # Environment variables
│   ├── db.js                      # MongoDB connection
│   ├── server.js                  # Express app entry point
│   └── package.json
│
└── frontend/
    ├── index.html                 # Landing page
    ├── login.html                 # Login page
    ├── signup.html                # Registration page
    ├── dashboard.html             # User dashboard
    ├── admin.html                 # Admin dashboard
    ├── reader.html                # PDF reader
    ├── reviews.html               # Reviews page
    ├── ratings.html               # Ratings page
    ├── history.html               # Reading history
    ├── login.js                   # Login logic
    ├── signup.js                  # Signup logic
    ├── admin.js                   # Admin operations
    ├── history.js                 # History operations
    ├── config.js                  # API configuration
    ├── style.css                  # Global styles
    └── assets/                    # Images, icons, etc.
```

---

## 🔧 Implementation Details

### Backend Architecture

#### 1. **Authentication System**
- **Password Hashing**: Uses `bcryptjs` with salt rounds of 10
- **JWT Tokens**: Signed with secret key, expires in 7 days
- **Middleware**: `authMiddleware.js` verifies JWT on protected routes
- **Role-based Access**: `adminMiddleware.js` checks for admin role

#### 2. **Rental System Workflow**
1. User submits rental request with hours and transaction ID
2. Status set to "pending"
3. Admin reviews in admin dashboard
4. Admin approves → Status changes to "active", start/end times set
5. Admin rejects → Status changes to "rejected", email sent to user
6. Auto-expiry check: When fetching active rentals, system checks if `endTime < now` and updates status to "expired"

#### 3. **Extension System Workflow**
1. User requests extension on active rental
2. `extensionStatus` set to "pending"
3. Admin reviews pending extensions
4. Admin approves → Hours added to `endTime`, extension fields cleared
5. Admin rejects → `extensionStatus` set to "rejected"

#### 4. **Email Notification System**
- **Service**: Gmail SMTP via Nodemailer
- **Configuration**: Requires `EMAIL_USER` and `EMAIL_PASS` in `.env`

**Automated Email Triggers:**

1. **New Book Added** (Admin Action)
   - **When**: Admin creates a new book via `POST /api/books`
   - **Recipients**: All registered users
   - **Subject**: "📚 New Book Added to Readify!"
   - **Content**: Book title, author, and invitation to check it out
   - **Implementation**: 
     ```javascript
     // Fetches all users and sends notification
     const users = await User.find({}, 'email');
     const recipientEmails = users.map(user => user.email);
     // Sends email to all users
     ```

2. **Rental Rejection** (Admin Action)
   - **When**: Admin rejects a rental request via `PUT /api/rentals/reject/:id`
   - **Recipients**: The user whose rental was rejected
   - **Subject**: "Rental Request Rejected - Readify"
   - **Content**: Rental rejection notification with book details
   - **Implementation**: Sends email to `rental.userId.email`

**Email Failure Handling:**
- Email failures do not prevent the primary action (book creation/rental rejection)
- Errors are logged to console for debugging
- Graceful degradation ensures system reliability

#### 5. **File Upload System**
- PDFs stored in `backend/uploads/pdfs/`
- Served statically via Express at `/pdfs` route
- CORS configured for PDF access

### Frontend Architecture

#### 1. **Authentication Flow**
- JWT token stored in `localStorage`
- Token sent in `Authorization: Bearer <token>` header
- Auto-redirect to login if token missing/invalid

#### 2. **Dashboard Features**
- Displays all books with cover images
- Rent button for rentable books
- Modal for rental form (hours + transaction ID)
- Real-time cost calculation
- "My Rentals" section showing active/pending/rejected rentals

#### 3. **Admin Dashboard Features**
- **All Books Table**: View, edit, delete, toggle rentable status
- **Pending Rentals Table**: Approve/reject rental requests
- **Pending Extensions Table**: Approve/reject extension requests
- **Active Rentals Table**: View all active rentals with expiry times

#### 4. **PDF Reader**
- Embedded PDF viewer
- Reading progress tracking
- History update on page navigation

---

## 🌐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/readify?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

> [!IMPORTANT]
> For Gmail, you need to generate an **App Password** from your Google Account settings, not your regular password.

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Gmail account for email notifications

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with required variables
# (See Environment Variables section above)

# Start the server
npm start
# or for development with auto-reload
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Serve with any static server, e.g., Live Server in VS Code
# or use Python's built-in server
python -m http.server 8000

# or Node.js http-server
npx http-server -p 8000
```

Frontend will be accessible at `http://localhost:8000`

---

## 🧪 Testing

### Testing with Postman

1. **Import Collection**: Create a new collection in Postman
2. **Set Base URL**: `http://localhost:5000/api`
3. **Test Authentication**:
   - Register: `POST /auth/register`
   - Login: `POST /auth/login` → Copy the JWT token
4. **Set Authorization**: 
   - Go to Authorization tab
   - Type: Bearer Token
   - Token: Paste JWT token
5. **Test Protected Routes**:
   - Create book (admin only)
   - Create rental request
   - Approve rental (admin only)
   - etc.

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Browse books as guest
- [ ] View book details
- [ ] Submit rental request
- [ ] Admin login
- [ ] Admin approve/reject rental
- [ ] Check email notification
- [ ] Request rental extension
- [ ] Admin approve/reject extension
- [ ] Add review and rating
- [ ] View reading history
- [ ] PDF reader functionality

---

## 🌐 Deployment

### Backend Deployment (Render)

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: Add all variables from `.env`
4. Deploy

### Frontend Deployment (Render/Netlify/Vercel)

1. Deploy as a **Static Site**
2. Connect GitHub repository
3. Set publish directory to `frontend/`
4. Update `frontend/config.js` with deployed backend URL

---

## 📊 Database Indexes

For optimal performance, the following indexes are automatically created:

- **User**: `email` (unique)
- **Rating**: Compound index on `(user, book)` (unique)
- **History**: Compound index on `(userId, bookId)` (unique)

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Role-based access control (User/Admin)
- ✅ CORS configuration
- ✅ Helmet.js for HTTP headers security
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention via Mongoose

---

## 🎯 Future Enhancements

- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Real-time notifications (Socket.io)
- [ ] Advanced search and filters
- [ ] Book recommendations based on reading history
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Social sharing features
- [ ] Wishlist functionality
- [ ] Reading challenges and achievements

---

## 📸 Screenshots

![Schema Diagram](schema%20diagram.png)

---

## 👨‍💻 Developer

**Yashwanth Raj KS**  
Full-Stack Web Application Project - Readify  
RVU23BSC180

---

## 📄 License

This project is developed as an academic project for educational purposes.

---

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Render for deployment platform
- Google Books API for book data
- All open-source libraries used in this project
