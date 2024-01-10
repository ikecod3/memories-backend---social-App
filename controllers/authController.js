import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

export const register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  //   validate fields to ensure they are not empty
  if (!(firstName || lastName || email || password)) {
    next("Provide Required Fields!");
    return;
  }

  // proceed with the below try and catch if they are not empty
  try {
    // find the email in the user colection
    const userExist = await Users.findOne({ email });
    // if found - stop processing the registration data
    if (userExist) {
      next("Email Address already exits");
      return;
    }

    const hashedPassword = await hashString(password);
    const user = await Users.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // send email verification to user
    sendVerificationEmail(user, res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // validation to ensure the login credentials is not empty
    if (!email || !password) {
      next("Please provide valid user credentials");
      return;
    }

    // find user by email
    // Include the 'password' field in the query result
    // (This is necessary because when using select to explicitly include a field)
    // Populate the 'friends' field, specifying fields to include/exclude
    const user = await Users.findOne({ email }).populate({
      // Specify the field to populate
      path: "friends",
      // Specify the fields to include or exclude in the populated 'friends'
      // Include these fields but the 'password' field
      select: "firstName lastName location profileUrl -password",
    });

    // check if the user exist
    if (!user) {
      next("Invalid email or password");
      return;
    }

    // check if the user is verified
    if (!user?.verified) {
      next(
        "Email is not verified. Check your email inbox and verify your email"
      );
      return;
    }
    // when the above condition is satisfied .ie. user exist and verified
    // compare password
    const isMatch = await compareString(password, user?.password);

    if (!isMatch) {
      next("Invalid email or password");
      return;
    }

    // delete user.password;
    const token = createJWT(user?._id);
    // console.log(token);
    res
      .status(201)
      .json({ success: true, message: "Login Successful", user, token });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
