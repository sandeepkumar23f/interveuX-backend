import express from "express";
import { SignUp, Login, GoogleLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", SignUp);
router.post("/login", Login);
router.post("/google", GoogleLogin);

export default router;