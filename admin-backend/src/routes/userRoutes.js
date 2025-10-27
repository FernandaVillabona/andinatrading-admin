// src/routes/userRoutes.js
import express from "express";
import { loginUser, getUsers, registerUser } from "../controllers/userController.js";

const router = express.Router();

// 🔹 LOGIN ADMIN
router.post("/login", loginUser);

// 🔹 CRUD ADMIN
router.get("/usuarios", getUsers);
router.post("/usuarios", registerUser);
router.get("/getAllUsers", getUsers);


export default router;
