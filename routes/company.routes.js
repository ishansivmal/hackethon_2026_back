const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
    postInternship,
    postJob,
    postProblem
} = require("../controllers/company.controller");

// Everything below requires an authenticated company account
router.use(authenticateToken, authorizeRoles("company"));

router.post("/internships", postInternship);

router.post("/jobs", postJob);

router.post("/problems", postProblem);

module.exports = router;
