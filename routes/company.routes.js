const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const {
    postInternship,
    postJob,
    postProblem,
    getCompanyDashboard,
    getCompanyApplications,
    updateApplicationSelection,
    updateInternship,
    deleteInternship,
    updateJob,
    deleteJob,
    updateProblem,
    deleteProblem
} = require("../controllers/company.controller");

const { rankApplicants } = require("../controllers/ai.controller");

// Everything below requires an authenticated company account
router.use(authenticateToken, authorizeRoles("company"));

router.get("/dashboard", getCompanyDashboard);
router.get("/applications/:type", getCompanyApplications);

router.put("/applications/:type/:id", updateApplicationSelection);
router.post("/applications/rank/:type/:id", rankApplicants);

router.post("/internships", upload.single("photo"), postInternship);
router.put("/internships/:id", upload.single("photo"), updateInternship);
router.delete("/internships/:id", deleteInternship);

router.post("/jobs", upload.single("image"), postJob);
router.put("/jobs/:id", upload.single("image"), updateJob);
router.delete("/jobs/:id", deleteJob);

router.post("/problems", upload.single("pdf"), postProblem);
router.put("/problems/:id", upload.single("pdf"), updateProblem);
router.delete("/problems/:id", deleteProblem);

module.exports = router;
