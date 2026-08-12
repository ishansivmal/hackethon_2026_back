const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const {
    postInternship,
    postJob,
    postProblem
} = require("../controllers/company.controller");

// Everything below requires an authenticated company account
router.use(authenticateToken, authorizeRoles("company"));

router.post("/internships", upload.single("photo"), postInternship);

router.post("/jobs", upload.single("image"), postJob);

router.post("/problems", upload.single("pdf"), postProblem);

module.exports = router;
