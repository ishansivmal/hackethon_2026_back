const express = require("express");
const router = express.Router();
const { getInternships, getJobs, getProblems } = require("../controllers/public.controller");

router.get("/internships", getInternships);
router.get("/jobs", getJobs);
router.get("/problems", getProblems);

module.exports = router;
