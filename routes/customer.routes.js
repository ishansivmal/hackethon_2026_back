const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const protect = require("../middleware/auth.middleware");
const { applyForInternship, applyForJob, applyForProblem } = require("../controllers/customer/customer.controller");
const { getAppliedRecord } = require("../controllers/customer/applied.controller");

router.post("/apply/internship/:id", protect, upload.single("cv"), applyForInternship);
router.post("/apply/job/:id", protect, upload.single("cv"), applyForJob);
router.post("/apply/problem/:id", protect, upload.single("cv"), applyForProblem);

router.get("/applied", protect, getAppliedRecord);

module.exports = router;
