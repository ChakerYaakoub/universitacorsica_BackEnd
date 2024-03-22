// app.js

const express = require("express");
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors middleware

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Database initialization
const db = new sqlite3.Database("data.db");

// Create the users table (if not exists)
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userIp TEXT NOT NULL,
  isEnter INTEGER DEFAULT 1,
  isLogin Boolean DEFAULT false
)`);

// to delete the data just delete the file data.db

// or you can use the code below to delete the data from the table but the id still increasing !!

// API endpoint to insert IP address if it doesn't already exist
app.post("/api/open-site", (req, res) => {
  const { userIp } = req.body;

  // Check if the IP address already exists in the database
  db.get(`SELECT id FROM users WHERE userIp = ?`, [userIp], (err, row) => {
    if (err) {
      console.error("Error checking user IP:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else if (row) {
      // If IP address already exists, send a message indicating so
      res
        .status(200)
        .json({ message: "IP address already exists in the database" });
    } else {
      // If IP address doesn't exist, insert it into the database
      db.run(`INSERT INTO users (userIp) VALUES (?)`, [userIp], (err) => {
        if (err) {
          console.error("Error inserting user IP:", err.message);
          res.status(500).json({ error: "Internal server error" });
        } else {
          res.status(200).json({ message: "User IP inserted successfully" });
        }
      });
    }
  });
});

// API endpoint to update count when user tries to log in  just insert without checking if the user is already exist or not
// app.post("/api/login-attempt", (req, res) => {
//   const { userIp } = req.body;

//   db.run(
//     `UPDATE users SET isLogin = True WHERE userIp = ?`,
//     [userIp],
//     (err) => {
//       if (err) {
//         console.error("Error updating login count:", err.message);
//         res.status(500).json({ error: "Internal server error" });
//       } else {
//         res.status(200).json({ message: "Login count updated successfully" });
//       }
//     }
//   );
// });

// API endpoint to update count when user tries to log in  with checking if the user is already exist or not

app.post("/api/login-attempt", (req, res) => {
  const { userIp } = req.body;

  // Check if the user with the given IP address exists in the database
  db.get(`SELECT * FROM users WHERE userIp = ?`, [userIp], (err, row) => {
    if (err) {
      console.error("Error checking user:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else {
      if (!row) {
        // If user not found, insert a new record with the IP address
        db.run(
          `INSERT INTO users (userIp, isLogin) VALUES (?, ?)`,
          [userIp, true],
          (err) => {
            if (err) {
              console.error("Error inserting user IP:", err.message);
              res.status(500).json({ error: "Internal server error" });
            } else {
              res
                .status(200)
                .json({ message: "User IP inserted successfully" });
            }
          }
        );
      } else {
        // If user found, update the isLogin field for that record
        db.run(
          `UPDATE users SET isLogin = ? WHERE userIp = ?`,
          [true, userIp],
          (err) => {
            if (err) {
              console.error("Error updating login count:", err.message);
              res.status(500).json({ error: "Internal server error" });
            } else {
              res
                .status(200)
                .json({ message: "Login count updated successfully" });
            }
          }
        );
      }
    }
  });
});

// ----------------------------------------------------------------
// post man APi  --------------------------------------------------
// ----------------------------------------------------------------

// Route handler for root
// test
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// API endpoint to get all data from the users table
app.get("/api/users", (req, res) => {
  db.all(`SELECT * FROM users`, (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.status(200).json(rows);
    }
  });
});

// API endpoint to delete all old data from the users table
// just use this in postman
app.delete("/api/users", (req, res) => {
  db.run(`DELETE FROM users`, (err) => {
    if (err) {
      console.error("Error deleting old data:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.status(200).json({ message: "Old data deleted successfully" });
    }
  });
});

// our result is here

// we can convert it to json format (download it as json file from postman) ==> the we can convert to Excel file
// https://data.page/json/csv

// API endpoint to get counts of open site attempts and login attempts
app.get("/api/stats", (req, res) => {
  // Query the database to get the counts
  db.get(
    `SELECT 
        SUM(isEnter) AS totalEntered, 
        SUM(CASE WHEN isLogin = 1 THEN 1 ELSE 0 END) AS totalLoggedIn,
        SUM(CASE WHEN isLogin = 0 THEN 1 ELSE 0 END) AS totalNotLoggedIn   
      FROM users`,
    (err, row) => {
      if (err) {
        console.error("Error getting stats:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        // Return the counts as JSON response
        res.status(200).json({
          totalEntered: row.totalEntered || 0,
          totalLoggedIn: row.totalLoggedIn || 0,
          totalNotLoggedIn: row.totalNotLoggedIn || 0,
        });
      }
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ©CHOIP 2024, All rights reserved.
