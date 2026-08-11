const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
    getAllUsers,
    updateUserRole,
    deleteUser
} = require("../controllers/admin.controller");

// Everything below is admin-only
router.use(authenticateToken, authorizeRoles("admin"));

router.get("/users", getAllUsers);

router.put("/users/:id/role", updateUserRole);

router.delete("/users/:id", deleteUser);

module.exports = router;
