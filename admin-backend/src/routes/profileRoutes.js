import express from "express";
import { verificarToken } from "../middleware/authMiddleware.js";
import { getMyProfile, updateMyName, changeMyPassword } from "../controllers/profileController.js";

const router = express.Router();

router.use(verificarToken);

router.get("/me", getMyProfile);
router.patch("/me", updateMyName);
router.patch("/me/password", changeMyPassword);

export default router;
