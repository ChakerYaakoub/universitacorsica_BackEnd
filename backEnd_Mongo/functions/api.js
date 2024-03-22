// app.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors middleware
const serverless = require("serverless-http");
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const router = express.Router();

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Database initialization
// Define MongoDB connection string

const mongoURI =
  process.env.DB_CONNECTION ||
  "mongodb+srv://chaker:chaker@cluster0.ydzp4zb.mongodb.net/";

// Function to connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(
      mongoURI,

      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error; // Rethrow the error to be caught by the calling function
  }
};

// Define a function to disconnect from MongoDB
const disconnectFromDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error.message);
    throw error; // Rethrow the error to be caught by the calling function
  }
};

// Define a Mongoose Schema
const userSchema = new mongoose.Schema(
  {
    userIp: { type: String, required: true },
    isEnter: { type: Number, default: 1 },
    isLogin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create a Mongoose Model
const User = mongoose.model("User", userSchema);

// API endpoint to insert IP address if it doesn't already exist
router.post("/open-site", async (req, res) => {
  const { userIp } = req.body;

  try {
    // Check if the IP address already exists in the database
    await connectToDatabase();

    const existingUser = await User.findOne({ userIp });
    if (existingUser) {
      await disconnectFromDatabase();
      res
        .status(200)
        .json({ message: "IP address already exists in the database" });
    } else {
      // If IP address doesn't exist, insert it into the database
      await User.create({ userIp });
      await disconnectFromDatabase();

      res.status(200).json({ message: "User IP inserted successfully" });
    }
  } catch (error) {
    await disconnectFromDatabase();

    console.error("Error inserting user IP:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to update count when user tries to log in  with checking if the user is already exist or not

router.post("/login-attempt", async (req, res) => {
  const { userIp } = req.body;

  try {
    await connectToDatabase();

    // Find the user by IP address
    let user = await User.findOne({ userIp });

    if (!user) {
      // If user not found, insert a new record
      user = await User.create({ userIp, isLogin: true });
    } else {
      // If user found, update the isLogin field
      await User.updateOne({ userIp }, { isLogin: true });
    }

    res.status(200).json({ message: "Login count updated successfully" });
  } catch (error) {
    await disconnectFromDatabase();
    console.error("Error updating login count:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------------------------------------------------
// postman APi  --------------------------------------------------
// ----------------------------------------------------------------

// Route handler for root
// test

router.get("/", (req, res) => {
  res.send("Hello World!");
});

// API endpoint to get all data from the users collection
router.get("/users", async (req, res) => {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Fetch users
    const users = await User.find();

    // Disconnect from MongoDB
    await disconnectFromDatabase();

    // Send response with users
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to delete all data from the users collection
router.delete("/users", async (req, res) => {
  try {
    await connectToDatabase();

    await User.deleteMany();
    res.status(200).json({ message: "Old data deleted successfully" });
  } catch (error) {
    await disconnectFromDatabase();

    console.error("Error deleting old data:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to get counts of open site attempts and login
// statistics
// our result is here
// we can convert it to json format (download it as json file from postman) ==> the we can convert to Excel file
// https://data.page/json/csv

router.get("/stats", async (req, res) => {
  try {
    await connectToDatabase();

    const totalEntered = await User.countDocuments();
    const totalLoggedIn = await User.countDocuments({ isLogin: true });
    const totalNotLoggedIn = await User.countDocuments({ isLogin: false });
    await disconnectFromDatabase();

    res.status(200).json({
      totalEntered,
      totalLoggedIn,
      totalNotLoggedIn,
    });
  } catch (error) {
    await disconnectFromDatabase();

    console.error("Error getting stats:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
// for running local
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// we use this just online
app.use(`/.netlify/functions/api`, router);
// app.use(`/`, router);

// example to use :
// https://cheery-kheer-98f25b.netlify.app/.netlify/functions/api/users

// https://cheery-kheer-98f25b.netlify.app/  ==> our site

// Export functions for connecting and disconnecting from MongoDB
// maybe not require to do this
module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};

// for hosting on netlify
module.exports.handler = serverless(app);

// npm run build = to build the project or update

// -----------------------------------
// ©CHOIP 2024, All rights reserved.
