import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { connection } from "../config/dbconfig.js";
import dotenv from "dotenv";

dotenv.config();

export const SignUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const db = await connection();
    const collection = db.collection("users");

    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists, please login"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newUser);

    if (result.acknowledged) {
      const tokenData = {
        _id: result.insertedId.toString(),
        email: email,
      };

      const token = jwt.sign(tokenData,"Google", process.env.JWT_SECRET, {
        expiresIn: "5d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 5 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        success: true,
        message: "Signup successful",
        user: {
          id: result.insertedId,
          name,
          email,
        },
      });
    }
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again later",
    });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const db = await connection();
    const collection = db.collection("users");

    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const tokenData = {
      _id: user._id.toString(),
      email: user.email,
    };

    const token = jwt.sign(
      tokenData,
      "Google",
      process.env.JWT_SECRET,
      {
        expiresIn: "5d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000
      ),
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};