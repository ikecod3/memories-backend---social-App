import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { hashString } from "./index.js";
import Verification from "../models/emailVerification.js";
import PasswordReset from "../models/passwordReset.js";

dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD, APP_URL } = process.env;

const mailTransporter = nodemailer.createTransport({
  service: "Gmail", // email service provider
  auth: {
    user: AUTH_EMAIL, //your email username/address
    pass: AUTH_PASSWORD, //use app password created on your emaol account
  },
});

export const sendVerificationEmail = async (user, res) => {
  const { _id, email, lastName } = user;
  const token = _id + uuidv4();
  const link = APP_URL + "/users/verify/" + _id + "/" + token;

  const mailOptions = {
    from: AUTH_EMAIL, // sender email address
    to: email, //receiver email address
    subject: "Memories: Email Verification",
    html: `<div style="color: #333; font-size:20px; font-family:Arial,sans-serif">
    <h1 style="color:rgb(8, 56, 188)"> Please verify your email address</h1>
    <hr>
    <h4>Hello ${lastName},</h4>
    <p>
    Please verify your email address to continue sharing your memories with people around you and loved ones. <br>
    <p>The link <b>expires in 1 hour</b></p>

    <br>
    <a href=${link} style="padding:14px; border-radius:5px; color:#fff; text-decoration:none; background-color:#000"> Verify Email Address</a>
    </p>
    <div style="margin-top:20px">
      <h5>Best Regards</h5>
      <h5>Memories Team</h5>
    </div>
    
    </div>`,
  };

  try {
    // hash token
    const hashedToken = await hashString(token);

    const newVerifiedEmail = await Verification.create({
      userId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, //milli seconds
    });
    //  the the verfication model is successful then proceed to send the mail otherwise catch something that went wrong
    if (newVerifiedEmail) {
      mailTransporter.sendMail(mailOptions).then(() => {
        res.status(201).send({
          success: "PENDING",
          message:
            "Verification email has been sent to your email address. Check your inbox or spambox for further instructions",
        });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};

export const sendResetPasswordLink = async (user, res) => {
  const { _id, email, lastName } = user;
  const token = _id + uuidv4();
  const link = APP_URL + "/users/reset-password/" + _id + "/" + token;

  const mailOptions = {
    from: AUTH_EMAIL, // sender email address
    to: email, //receiver email address
    subject: "Memories: Password Reset Request",
    html: `<div style="color: #333; font-size:20px; font-family:Arial,sans-serif">
    <h4>Hello ${lastName},</h4>
    <p>
     <h3 style="background-color: lightgrey; padding: 10px;border-radius: 10px"> Password Reset Link. Please click the link below to reset your password </h3>
    <p style="font-size:18px;"><b> The link expires in 10 minutes</b></p>
    <br>
    <a href=${link} style="padding:14px; border-radius:5px; color:#fff; text-decoration:none; background-color:crimson"> Reset Password</a>
    </p>
    <div style="margin-top:20px">
      <h5>Best Regards</h5>
      <h5>Memories Team</h5>
    </div>
    
    </div>`,
  };

  try {
    // hash token
    const hashedToken = await hashString(token);

    const resetPasswordEmail = await PasswordReset.create({
      userId: _id,
      email: email,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000, //milli seconds = 10 minutes
    });
    //  the the verfication model is successful then proceed to send the mail otherwise catch something that went wrong
    if (resetPasswordEmail) {
      mailTransporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING",
            message:
              "Reset Password Link has been sent to your email address. Kindly check your inbox or spam folder.",
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(404).json({ message: "Something went wrong" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};
