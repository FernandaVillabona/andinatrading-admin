import express from "express";
import { loginUser, getUsers, registerUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/login", loginUser);

router.get("/usuarios", getUsers);
router.post("/usuarios", registerUser);
router.get("/getAllUsers", getUsers);


export default router;
