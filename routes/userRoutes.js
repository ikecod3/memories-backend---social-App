import express from "express";
import {
  acceptRequest,
  changePassword,
  friendRequest,
  getFriendRequest,
  getUser,
  profileViews,
  requestPasswordReset,
  resetPassword,
  suggestedFriends,
  updateUser,
  verifyEmail,
} from "../controllers/userController.js";
import userAuth from "../middleware/authMiddleware.js";
const router = express.Router();

/* *****************************************
 **     VERIFICATION routes                **
 **    ******************** *************   **
 */
// when the user click the link via email. conditionally redirect the user to /verified get request
router.get("/verify/:userId/:token", verifyEmail);
// display verification status and message
router.get("/verified", (req, res) => {
  // const status = req.query.status;
  // const message = req.query.message;
  const title = "Email Verification";
  const { status, message, type, userId } = req.query;
  res.render("index", { status, message, title, type, userId });
});

/* ******************************************
 **             USER ROUTES                **
 **    ********************      ************
 */
router.post("/get-user/:id?", userAuth, getUser);
router.put("/update-user", userAuth, updateUser);

/* ************************************************************
 **  FRIEND REQUEST X profile view x suggested friends ROUTES **
 **    ********************   *********************************
 */
router.post("/friend-request", userAuth, friendRequest);
router.post("/get-friend-request", userAuth, getFriendRequest);

//accept/ deny friend request
router.post("/accept-request", userAuth, acceptRequest);

// view profile
router.post("/profile-view", userAuth, profileViews);

// suggested friends
router.post("/suggested-friends", userAuth, suggestedFriends);

/* ******************************************
 **    PASSWORD RESET routes                **
 **    ********************   ***************
 */
// check for existing request or send a new reset email if a reset request does not exist
router.post("/request-passwordreset", requestPasswordReset);

// when the email link is clicked-- check request parameter for validity and correctness. if correct and valid -- redirect user to a reset password form
router.get("/reset-password/:userId/:token", resetPassword); //find users record

// handles when the resetPassword form is submitted
router.post("/reset-password", changePassword);

router.get("/resetpassword", (req, res) => {
  //   const status = req.query.status;
  //   const message = req.query.message;
  //   const type = req.query.type;
  //   const userId = req.query.id;
  const { status, message, type, userId } = req.query;
  const title = "Reset Password";

  res.render("index", { status, message, title, type, userId });
});

export default router;
