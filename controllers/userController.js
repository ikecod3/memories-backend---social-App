import Verification from "../models/emailVerification.js";
import FriendRequest from "../models/friendRequest.js";
import PasswordReset from "../models/passwordReset.js";
import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendResetPasswordLink } from "../utils/sendEmail.js";

export const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    // Find the verification record based on userId
    const verification = await Verification.findOne({ userId });

    if (!verification) {
      // If no verification record is found, the link is invalid
      const message = "Invalid verification link. Try again later";
      return res.redirect(`/users/verified?status=error&message=${message}`);
    }

    const { expiresAt, token: hashedToken } = verification;
    // console.log("expired", expiresAt < Date.now()); // returns false if token is still valid

    if (expiresAt < Date.now()) {
      // Token has expired, delete verification and user records
      //   mutilple database query
      await Promise.all([
        Verification.findOneAndDelete({ userId: userId }),
        Users.findOneAndDelete({ _id: userId }),
      ]);

      const message = "Verification token has expired.";
      return res.redirect(`/users/verified?status=error&message=${message}`);
    }

    // Check if the provided token matches the hashed token
    const isTokenValid = await compareString(token, hashedToken);
    // console.log(isTokenValid);

    if (!isTokenValid) {
      // Invalid token provided
      const message = "Verification failed or link is invalid";
      return res.redirect(`/users/verified?status=error&message=${message}`);
    }
    console.log(userId);
    // Update user's verification status to true
    await Users.findOneAndUpdate({ _id: userId }, { verified: true });

    // Delete the verification record after successful verification
    await Verification.findOneAndDelete({ userId: userId });

    const message = "Email verified successfully";
    res.redirect(`/users/verified?status=success&message=${message}`);
  } catch (error) {
    console.error(error);
    // Handle unexpected errors with a generic error message
    res.redirect(`/users/verified?status=error&message=`);
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message:
          "Email address not found. Please enter your correct email address or create a new account",
      });
    }
    // to ensure the user has a pending / or previous reques
    const existingRequest = await PasswordReset.findOne({ email });
    // when existingRequest is not null
    if (existingRequest) {
      // and token is still valid -- return a PENDING status and message
      if (existingRequest.expiresAt > Date.now()) {
        return res.status(201).json({
          status: "PENDING",
          message: "Password Reset link has already been sent to your email",
        });
      }
      //  if token has expired -- delete it request from password reset model
      await PasswordReset.findOneAndDelete({ email });
    }
    // send a new link to the user
    await sendResetPasswordLink(user, res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  try {
    // find record
    const user = await Users.findById(userId);

    if (!user) {
      const message = "Invalid password or reset link. Try again";
      res.redirect(`/users/resetpassword?&status=error&message=${message}`);
    }

    // if the user exist -- ensure the user requested for a password reset
    const resetPassword = await PasswordReset.findOne({ userId });

    if (!resetPassword) {
      const message = "Invalid password reset link. Try again";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    // if the reset link record not null -- check validity of the link and correctness of  token

    const { expiresAt, token: resetToken } = resetPassword;

    // checks validity of link
    if (expiresAt < Date.now()) {
      const message = "Reset link has expired. Please try again";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    const isMatch = await compareString(token, resetToken);
    // checks correctness of token

    if (!isMatch) {
      const message = "Invalid reset password link. Please try again";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    } else {
      res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
    }
  } catch (error) {
    console.log(error);
    // res.status(404).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    // when a user submit a form -- it comes with a some data userId and password
    // console.log(req.body);
    const { userId, password1, password2 } = req.body;
    if (password1 !== password2) {
      const message = "password do not match";
      res.redirect(`/users/resetpassword?type=reset&message=${message}`);
      return;
    }
    // since the passwords are equal,
    const password = password1;
    // hash the password
    const hashedpassword = await hashString(password);
    // update only the user password field in database
    const user = await Users.findByIdAndUpdate(
      { _id: userId },
      { password: hashedpassword }
    );

    // delete the user record from passwordReset model

    if (user) {
      await PasswordReset.findOneAndDelete({ userId });
      const message = "Password Reset was successfully.";
      res.redirect(`/users/resetpassword?status=success&message=${message}`);
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;

    const user = await Users.findById(id ?? userId).populate({
      path: "friends",
      select: "-password",
    });
    // if user retrun null
    if (!user) {
      return res
        .status(200)
        .send({ message: "User Not Found", success: false });
    }

    res.status(200).json({ success: true, user: user });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, location, profileUrl, profession } = req.body;

    if (!(firstName || lastName || location || profileUrl || profession)) {
      next("Please provide all required fields");
      return;
    }
    // grab the userId
    const { userId } = req.body.user;

    // create a new object
    const updateUser = {
      firstName,
      lastName,
      location,
      profileUrl,
      profession,
      _id: userId,
    };

    const user = await Users.findByIdAndUpdate(userId, updateUser, {
      new: true,
    });
    // you may add , -password
    await user.populate({ path: "friends" });
    // create a new token
    const token = createJWT(user?._id);

    // send the resposne to user
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const friendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body.user;

    // requestTo is the Id of the person we send a request to
    const { requestTo } = req.body;
    // console.log("requestTo", requestTo);
    // console.log("userId", userId);

    // check if friend request already exist  from either side
    const requestExist = await FriendRequest.findOne({
      requestFrom: userId,
      requestTo,
    });
    // console.log("requestExist", requestExist);

    if (requestExist) {
      next("Friend Request already sent.");
      return;
    }

    // if the friend already sent a friend request
    const accountExist = await FriendRequest.findOne({
      requestFrom: requestTo,
      requestTo: userId,
    });
    console.log("account exist", accountExist);

    if (accountExist) {
      next("Friend Request already sent.");
      return;
    }

    // create a new request
    const newRes = await FriendRequest.create({
      requestTo,
      requestFrom: userId,
    });

    // send repsonse back to the user
    res
      .status(201)
      .json({ success: true, message: "Friend Request sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error: auth error",
      success: false,
      error: error.message,
    });
  }
};

export const getFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body.user;

    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "Pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({ _id: -1 });
    // send the data back to user-- request variable is the result of databse query
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const id = req.body.user.userId;
    // console.log("my id", id);
    // grab request details from request body -- rid is requestId
    const { rid, status } = req.body;
    // console.log("request id", rid);

    const requestExist = await FriendRequest.findById({ _id: rid });
    // console.log("Yes?", requestExist);

    if (!requestExist) {
      next("No Friend Request Found. Kindly Send a Friend Request");
      return;
    }

    // Check if the request has already been accepted. This ensures thatt there is no duplicate in user's friends list
    if (requestExist.requestStatus === "Accepted") {
      next("Friend Request has already been accepted.");
      return;
    }

    // find and update the statuus of the friendrequest in the database with status value
    const newRes = await FriendRequest.findByIdAndUpdate(
      {
        _id: rid,
      },
      { requestStatus: status }
    );

    // when a user accept a friend request, that is the status value from request body equals accepted
    if (status === "Accepted") {
      // search user by id
      const user = await Users.findById(id);
      //   console.log("id", id);
      // add reqeustTo to user friend list
      user.friends.push(newRes?.requestTo);
      // save the document
      await user.save();
      // we also want to  add user to the friend friends list
      // search friend by Id
      const friend = await Users.findById(newRes?.requestTo);
      // push user to friend friends list
      friend.friends.push(newRes?.requestFrom);
      // save the document
      await friend.save();
    }
    // send feedback to client
    res.status(201).json({
      success: true,
      message: `Friend Request ${status}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Auth error: Error processing friend request",
      success: false,
      error: error.message,
    });
  }
};

export const profileViews = async (req, res, next) => {
  try {
    // grab user id and viewed profile
    const { userId } = req.body.user;

    const { id } = req.body;

    const user = await Users.findById(id);
    // update/push id into the viewed profile views
    user.views.push(userId);

    await user.save();
    res.status(201).json({ success: true, message: "successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};

export const suggestedFriends = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    // initialize an empty query object for search
    let queryObject = {};
    // Obviously, suggested friends should not inlude userId
    queryObject._id = { $ne: userId };
    // also, it should also not include user existing friends
    queryObject.friends = { $nin: userId };
    let queryResult = Users.find(queryObject)
      .limit(15)
      .select("firstName lastName profileUrl profession -password");
    const suggestedFriends = await queryResult;

    res.status(200).json({ success: true, data: suggestedFriends });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
