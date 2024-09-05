const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const mysql = require("mysql2/promise")
require("dotenv").config()

const app = express()


app.use(cors())
app.use(bodyParser.json())

// Function to initialize the database connection
async function initializeDatabase() {
  try {
    const sqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
    console.log("Connected to MySQL as id " + sqlConnection.threadId)
    return sqlConnection
  } catch (err) {
    console.error("Error connecting to MySQL: ", err)
    throw err
  }
}

// Function to initialize the server
async function initializeServer() {
  const sqlConnection = await initializeDatabase()

  // Endpoint to create a new blog post
  app.post("/api/blogs", async (req, res) => {
    const { title, content } = req.body
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." })
    }

    try {
      const [rows] = await sqlConnection.query("SELECT * FROM posts")
      const posts = rows

      console.log("Posts length to calculate next id: ", posts.length)

      const newBlog = { id: posts.length + 1, title, content }

      await sqlConnection.query(
        "INSERT INTO posts (id, title, content) VALUES (?, ?, ?)",
        [newBlog.id, newBlog.title, newBlog.content]
      )

      return res.status(201).json(newBlog)
    } catch (err) {
      console.error("Error getting or inserting posts: ", err)
      return res.status(500).json({ message: "Internal server error" })
    }
  })

  // Endpoint to get all blog posts
  app.get("/api/blogs", async (req, res) => {
    try {
      const [blogs] = await sqlConnection.query("SELECT * FROM posts")
      res.json(blogs)
    } catch (err) {
      console.error("Error getting posts: ", err)
      return res.status(500).json({ message: "Internal server error" })
    }
  })

  app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`)
  })
}

// Initialize the server
initializeServer().catch((err) => {
  console.error("Failed to initialize server: ", err)
})
