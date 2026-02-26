const express = require("express");
const router = express.Router();
const userController = require("../controllers/auth.controller");
const authMiddleware=require("../middlewares/auth.middleware")

router.post("/login", userController.login);
router.post("/register", userController.register);
router.get("/me", authMiddleware.auth, userController.getInfo);
router.put("/me", authMiddleware.auth, userController.update);
router.put("/change-password", authMiddleware.auth, userController.changePassword);

module.exports = router;
