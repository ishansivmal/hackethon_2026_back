const express = require("express");

const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
} = require("../controllers/auth.controller");

const router = express.Router();

const authorizeRoles = require("../middleware/role.middleware");
const authenticateToken = require("../middleware/auth.middleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logoutUser);


// Protected profile route
router.get(
    "/profile",
    authenticateToken,
    (req, res) => {
        res.status(200).json({
            message: "You are authenticated!",
            user: req.user
        });
    }
);


// Admin-only route
router.get(
    "/admin-test",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res) => {
        res.status(200).json({
            message: "Welcome Admin"
        });
    }
);


module.exports = router;