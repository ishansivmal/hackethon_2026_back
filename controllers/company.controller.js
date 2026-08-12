const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const cloudinary = require("../config/cloudinaryConfig");

// The job/internship/problem models are factory-style (they take sequelize).
// Instantiate them once here so they are registered with the shared connection.
const Internship = require("../models/Internship")(sequelize, Sequelize.DataTypes);
const Job = require("../models/Job")(sequelize, Sequelize.DataTypes);
const Problem = require("../models/Problem")(sequelize, Sequelize.DataTypes);

// Uploads a file buffer to Cloudinary and resolves with the secure URL.
const uploadToCloudinary = (buffer, folder, resourceType = "auto") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// Normalizes a deadline value into a bare "YYYY-MM-DD" string (a DATETIME
// column stores it as midnight UTC). Returns null when the value cannot be
// parsed as a date. A bare date is used deliberately: Sequelize re-parses
// "YYYY-MM-DD HH:mm:ss" as local time and shifts the stored value by the
// server's UTC offset, while a bare "YYYY-MM-DD" survives unchanged.
const normalizeDeadline = (value) => {
    const str = String(value ?? "").trim();

    if (!str) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    const date = new Date(str);

    if (Number.isNaN(date.getTime())) return null;

    const pad = (n) => String(n).padStart(2, "0");

    // Build the date from local wall-clock components so a human-readable
    // value like "September 30, 2025" keeps its intended day.
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// =========================
// POST INTERNSHIP
// =========================

const postInternship = async (req, res) => {
    try {
        const {
            title,
            description,
            requirements,
            duration,
            location,
            internType,
            isPaid,
            deadline
        } = req.body;

        if (!title || !description || !requirements || !duration || !location || !deadline) {
            return res.status(400).json({
                message: "Title, description, requirements, duration, location and deadline are required"
            });
        }

        const normalizedDeadline = normalizeDeadline(deadline);

        if (!normalizedDeadline) {
            return res.status(400).json({
                message: "Deadline must be a valid date (e.g. 2025-09-30)"
            });
        }

        let photoUrl = null;

        if (req.file) {
            photoUrl = await uploadToCloudinary(req.file.buffer, "hackathon/internships", "image");
        }

        const internship = await Internship.create({
            user_ID: req.user.id, // from the authenticated JWT, never the client
            title,
            photoUrl,
            description,
            requirements,
            duration,
            location,
            internType: String(internType || "physical").toLowerCase(),
            isPaid: isPaid === true || isPaid === "true",
            deadline: normalizedDeadline
        });

        res.status(201).json({
            message: "Internship posted successfully",
            internship: {
                id: internship.id,
                title: internship.title,
                location: internship.location,
                internType: internship.internType,
                isPaid: internship.isPaid,
                deadline: internship.deadline
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// POST JOB
// =========================

const postJob = async (req, res) => {
    try {
        const {
            jobPosition,
            requirements,
            jobType,
            location,
            salary
        } = req.body;

        if (!jobPosition || !requirements || !location) {
            return res.status(400).json({
                message: "Job position, requirements and location are required"
            });
        }

        let photoUrl = null;

        if (req.file) {
            photoUrl = await uploadToCloudinary(req.file.buffer, "hackathon/jobs", "image");
        }

        const job = await Job.create({
            user_ID: req.user.id, // from the authenticated JWT, never the client
            position: jobPosition,
            photoUrl,
            requirements,
            jobType: String(jobType || "remote").toLowerCase(),
            location,
            salary: salary || null
        });

        res.status(201).json({
            message: "Job posted successfully",
            job: {
                job_ID: job.job_ID,
                position: job.position,
                jobType: job.jobType,
                location: job.location
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// POST PROBLEM
// =========================

const postProblem = async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({
                message: "Problem description is required"
            });
        }

        let pdf = null;

        if (req.file) {
            pdf = await uploadToCloudinary(req.file.buffer, "hackathon/problems", "auto");
        }

        const problem = await Problem.create({
            user_ID: req.user.id, // from the authenticated JWT, never the client
            description,
            pdf
        });

        res.status(201).json({
            message: "Problem submitted successfully",
            problem: {
                problem_ID: problem.problem_ID,
                description: problem.description
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    postInternship,
    postJob,
    postProblem
};
