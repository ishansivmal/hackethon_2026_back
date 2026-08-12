const cloudinary = require("../config/cloudinaryConfig");

const {
    Internship,
    Job,
    Problem,
    AppliedInternship,
    AppliedJob,
    AppliedProblem
} = require("../models");

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

// =========================
// GET COMPANY DASHBOARD
// (counts + the logged-in user's own published listings)
// =========================

const getCompanyDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const [internships, jobs, problems] = await Promise.all([
            Internship.findAll({
                where: { user_ID: userId },
                include: [{
                    model: AppliedInternship,
                    as: "applications",
                    attributes: ["applied_internship_ID", "user_ID", "isSelected"]
                }],
                order: [["createdAt", "DESC"]]
            }),
            Job.findAll({
                where: { user_ID: userId },
                include: [{
                    model: AppliedJob,
                    as: "applications",
                    attributes: ["applied_job_ID", "user_ID", "isSelected"]
                }],
                order: [["job_ID", "DESC"]]
            }),
            Problem.findAll({
                where: { user_ID: userId },
                include: [{
                    model: AppliedProblem,
                    as: "applications",
                    attributes: ["applied_problem_ID", "user_ID", "isSelected"]
                }],
                order: [["problem_ID", "DESC"]]
            })
        ]);

        const counts = {
            internships: internships.length,
            jobs: jobs.length,
            problems: problems.length,
            applications:
                internships.reduce((sum, item) => sum + item.applications.length, 0) +
                jobs.reduce((sum, item) => sum + item.applications.length, 0) +
                problems.reduce((sum, item) => sum + item.applications.length, 0)
        };

        res.status(200).json({ counts, internships, jobs, problems });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// UPDATE INTERNSHIP
// =========================

const updateInternship = async (req, res) => {
    try {
        const internship = await Internship.findOne({
            where: { id: req.params.id, user_ID: req.user.id }
        });

        if (!internship) {
            return res.status(404).json({ message: "Internship not found" });
        }

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

        let normalizedDeadline = internship.deadline;

        if (deadline !== undefined) {
            normalizedDeadline = normalizeDeadline(deadline);

            if (!normalizedDeadline) {
                return res.status(400).json({
                    message: "Deadline must be a valid date (e.g. 2025-09-30)"
                });
            }
        }

        const removePhoto = req.body.removePhoto === true || req.body.removePhoto === "true";

        let photoUrl = internship.photoUrl;

        if (req.file) {
            photoUrl = await uploadToCloudinary(req.file.buffer, "hackathon/internships", "image");
        } else if (removePhoto) {
            photoUrl = null;
        }

        await internship.update({
            title: title ?? internship.title,
            description: description ?? internship.description,
            requirements: requirements ?? internship.requirements,
            duration: duration ?? internship.duration,
            location: location ?? internship.location,
            internType: internType ? String(internType).toLowerCase() : internship.internType,
            isPaid: isPaid === undefined ? internship.isPaid : isPaid === true || isPaid === "true",
            deadline: normalizedDeadline,
            photoUrl
        });

        res.status(200).json({
            message: "Internship updated successfully",
            internship
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// DELETE INTERNSHIP
// =========================

const deleteInternship = async (req, res) => {
    try {
        const internship = await Internship.findOne({
            where: { id: req.params.id, user_ID: req.user.id }
        });

        if (!internship) {
            return res.status(404).json({ message: "Internship not found" });
        }

        await internship.destroy();

        res.status(200).json({ message: "Internship deleted successfully" });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// UPDATE JOB
// =========================

const updateJob = async (req, res) => {
    try {
        const job = await Job.findOne({
            where: { job_ID: req.params.id, user_ID: req.user.id }
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const {
            jobPosition,
            requirements,
            jobType,
            location,
            salary
        } = req.body;

        const removePhoto = req.body.removePhoto === true || req.body.removePhoto === "true";

        let photoUrl = job.photoUrl;

        if (req.file) {
            photoUrl = await uploadToCloudinary(req.file.buffer, "hackathon/jobs", "image");
        } else if (removePhoto) {
            photoUrl = null;
        }

        await job.update({
            position: jobPosition ?? job.position,
            requirements: requirements ?? job.requirements,
            jobType: jobType ? String(jobType).toLowerCase() : job.jobType,
            location: location ?? job.location,
            salary: salary ?? job.salary,
            photoUrl
        });

        res.status(200).json({
            message: "Job updated successfully",
            job
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// DELETE JOB
// =========================

const deleteJob = async (req, res) => {
    try {
        const job = await Job.findOne({
            where: { job_ID: req.params.id, user_ID: req.user.id }
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        await job.destroy();

        res.status(200).json({ message: "Job deleted successfully" });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// UPDATE PROBLEM
// =========================

const updateProblem = async (req, res) => {
    try {
        const problem = await Problem.findOne({
            where: { problem_ID: req.params.id, user_ID: req.user.id }
        });

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        const { description } = req.body;

        const removePdf = req.body.removePdf === true || req.body.removePdf === "true";

        let pdf = problem.pdf;

        if (req.file) {
            pdf = await uploadToCloudinary(req.file.buffer, "hackathon/problems", "auto");
        } else if (removePdf) {
            pdf = null;
        }

        await problem.update({
            description: description ?? problem.description,
            pdf
        });

        res.status(200).json({
            message: "Problem updated successfully",
            problem
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// DELETE PROBLEM
// =========================

const deleteProblem = async (req, res) => {
    try {
        const problem = await Problem.findOne({
            where: { problem_ID: req.params.id, user_ID: req.user.id }
        });

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        await problem.destroy();

        res.status(200).json({ message: "Problem deleted successfully" });

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
    postProblem,
    getCompanyDashboard,
    updateInternship,
    deleteInternship,
    updateJob,
    deleteJob,
    updateProblem,
    deleteProblem
};
