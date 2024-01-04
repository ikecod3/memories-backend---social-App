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

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(router);

app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send(`<h1>Welcome to Memories (Social App) Backend</h1>`);
});

app.listen(process.env.PORT || PORT, () =>
  console.log(`💨💨 Server running on port : ${PORT}`)
);
