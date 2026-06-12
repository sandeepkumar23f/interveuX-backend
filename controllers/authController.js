import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { connection } from "../config/dbconfig.js";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

// Initialize Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

      const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
        expiresIn: "5d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,     
        sameSite: "lax", 
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

    const isMatch = await bcrypt.compare(password, user.password);

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

    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "5d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,     
      sameSite: "lax", 
      maxAge: 5 * 24 * 60 * 60 * 1000,
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

export const GoogleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    console.log(" Google Login Attempt");
    console.log("Token present:", !!token);
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + "...");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log(" Token verified for:", payload.email);
    
    const userData = {
      googleId: payload['sub'],
      email: payload['email'],
      
      
    };

    const db = await connection();
    const collection = db.collection("users");

    let user = await collection.findOne({ email: userData.email });

    if (!user) {
      console.log("Creating new user:", userData.email);
      const newUser = {
        name: userData.name,
        email: userData.email,
        googleId: userData.googleId,
        picture: userData.picture,
        createdAt: new Date(),
      };
      const result = await collection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else if (!user.googleId) {
      console.log("Updating existing user with Google ID:", userData.email);
      await collection.updateOne(
        { email: userData.email },
        { $set: { googleId: userData.googleId, picture: userData.picture } }
      );
      user.googleId = userData.googleId;
    }

    const appToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.cookie("token", appToken, {
      httpOnly: true,
      secure: false,  
      sameSite: "lax",
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Google login successful",
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });

  } catch (error) {
    console.error("❌ Google Auth Error:", error.message);
    console.error("Full error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid Google token or verification failed",
      error: error.message, 
    });
  }
};