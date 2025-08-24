const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password min length is 6"),
  ],
  authController.register
);

router.post("/verify-email-otp", authController.verifyEmailOTP);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
