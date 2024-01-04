import express from "express";
import userAuth from "../middleware/authMiddleware.js";
import {
  commentPost,
  createPost,
  deletePost,
  getAllPosts,
  getComments,
  getSinglePost,
  getUserPost,
  likePost,
  likePostComment,
  replyPostComment,
} from "../controllers/postController.js";

const router = express.Router();

// create post
router.post("/create-post", userAuth, createPost); // create a post
// get post
router.post("/", userAuth, getAllPosts); // fetch all post
router.post("/:id", userAuth, getSinglePost); //fetch one post using id equals post id
router.post("/get-user-post/:id", userAuth, getUserPost); //fetch all post for a particular user using userId

// get comments
router.get("/comments/:postId", getComments); // fetch comment for a particular posts using postId

// like and comments on posts
router.post("/like/:id", userAuth, likePost); //like a post using postId
// like a comment
router.post("/like-comment/:id/:rid?", userAuth, likePostComment); //like a comment using comment id

router.post("/comment/:id", userAuth, commentPost); //write a comment with post id
router.post("/reply-comment/:id", userAuth, replyPostComment); //reply comment using comment id

// delete post
router.delete("/:id", userAuth, deletePost); //delete a single post using postId

export default router;
