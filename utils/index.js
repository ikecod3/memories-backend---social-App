import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
// function ot hash a string using bcrypt genSalt which adds a radom but unique value to the any string before hashing it
export const hashString = async (useValue) => {
  const salt = await bcrypt.genSalt(10);

  const hashedpassword = await bcrypt.hash(useValue, salt);
  return hashedpassword;
};
// function to compare an ordianry string and hashed string and return if it is thesame or not
export const compareString = async (userPassword, password) => {
  const isMatch = await bcrypt.compare(userPassword, password);
  return isMatch;
};

// JSON WEBTOKEN - function ot create/ sigin a jsonwebtoken using userID and set expiration  time to one-day
export function createJWT(id) {
  return JWT.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
}
