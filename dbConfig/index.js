import mongoose from "mongoose";

const connecToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connection successful ✅✅");
  } catch (error) {
    console.log("Connection failed" + error);
  }
};

export default connecToDatabase;
