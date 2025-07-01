import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import supabase from "../db.js";
import { verifyToken } from "../middleware/auth.js";

export const authRouter = express.Router();

// Helper function that creates JWT
const createToken = (user) => {
  return jwt.sign(
    { id: user.user_id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// POST request for registration (/api/auth/register)
authRouter.post("/register", async (req, res) => {
  let { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Please enter all fields." });
  }

  username = username.trim();
  email = email.trim().toLowerCase();

  if (!email.includes("@")) {
    return res.status(400).json({ message: "Invalid Email format" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  try {
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("*")
      .or(
        `username.eq.${encodeURIComponent(
          username
        )},email.eq.${encodeURIComponent(email)}`
      );

    if (checkError) throw checkError;

    if (existingUsers.length > 0) {
      const conflictField =
        existingUsers[0].username === username ? "username" : "email";

      return res
        .status(409)
        .json({ message: `This ${conflictField} is already registered.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({ username, email, password: hashedPassword })
      .select("user_id, username")
      .single();

    if (insertError) throw insertError;

    const token = createToken(newUser);

    res.status(201).json({
      message: "User registered!",
      token,
      username: newUser.username,
    });
  } catch (error) {
    console.error("Signup error: ", error);
    res.status(500).json({ message: "Server error." });
  }
});

// POST request for login (/api/auth/login)
authRouter.post("/login", async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide both email and password." });
  }

  email = email.trim().toLowerCase();

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = createToken(user);

    res.status(200).json({ token, username: user.username });
  } catch (error) {
    console.error("Login error: ", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET request  /api/auth/refresh
authRouter.get("/refresh", verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, username, email")
      .eq("user_id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found." });
    }

    const newToken = createToken(user);

    res.status(200).json({ token: newToken, user });
  } catch (error) {
    console.error("Refresh error: ", error);
    res.status(500).json({ message: "Server error." });
  }
});
