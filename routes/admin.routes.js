const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
    getAllUsers,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser,
    getAllCompanies,
    createCompany,
    updateCompany,
    updateCompanyStatus,
    deleteCompany
} = require("../controllers/admin.controller");

// Everything below is admin-only
router.use(authenticateToken, authorizeRoles("admin"));

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.get("/companies", getAllCompanies);
router.post("/companies", createCompany);
router.put("/companies/:id", updateCompany);
router.put("/companies/:id/status", updateCompanyStatus);
router.delete("/companies/:id", deleteCompany);

module.exports = router;
