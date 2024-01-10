import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";

// security packages
import helmet from "helmet";
import connecToDatabase from "./dbConfig/index.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import router from "./routes/index.js";

const __dirname = path.resolve(path.dirname(""));

// for passing req.body
dotenv.config();

const app = express();

// Serve static files from the 'views/build' directory
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "./public")));

const PORT = process.env.PORT || 8800;
connecToDatabase(); // database_connection
// setup helmet middleware to help secure Express apps by setting HTTP response headers.
app.use(helmet());
//enables a cross-orgin resource sharing to allow the frontend communicate with backend seamlessly
app.use(cors());

//settign up an express json middleware to enable parsing of incoming requests with JSON payloads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

//HTTP request logger middleware fro node.js
app.use(morgan("dev"));
app.use(router);

// defined an error middleware to ensure uniformity in error messages across various functions
app.use(errorMiddleware);

// dispaly this if the server is successfully hosted on cloud
app.get("/", (req, res) => {
  res.send(`<h1>Welcome to Memories (Social App) Backend Home Page</h1>`);
});

app.listen(process.env.PORT || PORT, () =>
  console.log(`💨💨 Server running on port : ${PORT}`)
);
