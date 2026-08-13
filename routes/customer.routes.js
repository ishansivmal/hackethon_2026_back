const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const protect = require("../middleware/auth.middleware");
const { applyForInternship, applyForJob, applyForProblem } = require("../controllers/customer/customer.controller");
const { getAppliedRecord, getAppliedInternships, getAppliedJobs, getAppliedProblems } = require("../controllers/customer/applied.controller");

router.post("/apply/internship/:id", protect, upload.single("cv"), applyForInternship);
router.post("/apply/job/:id", protect, upload.single("cv"), applyForJob);
router.post("/apply/problem/:id", protect, upload.single("cv"), applyForProblem);

router.get("/applied", protect, getAppliedRecord);
router.get("/applied/internship", protect, getAppliedInternships);
router.get("/applied/job", protect, getAppliedJobs);
router.get("/applied/problem", protect, getAppliedProblems);

module.exports = router;
