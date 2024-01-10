import express from "express";
import authRoute from "./authRoutes.js";
import userRoute from "./userRoutes.js";
import postRoute from "./postRoutes.js";
const router = express.Router();

router.use("/auth", authRoute); // fires anything that hit /auth
router.use("/users", userRoute); //fires anything that hit  /users
router.use("/posts", postRoute); // fires anything that hit /posts

export default router;
