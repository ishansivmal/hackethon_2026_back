const { Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const cloudinary = require("../../config/cloudinaryConfig");

const AppliedInternship = require("../../models/AppliedInternship")(sequelize, Sequelize.DataTypes);
const AppliedJob = require("../../models/AppliedJob")(sequelize, Sequelize.DataTypes);
const AppliedProblem = require("../../models/AppliedProblem")(sequelize, Sequelize.DataTypes);
const Solution = require("../../models/Solution")(sequelize, Sequelize.DataTypes);

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

const applyForInternship = async (req, res) => {
    try {
        const internship_ID = req.params.id;
        let cv_url = null;

        if (req.file) {
            cv_url = await uploadToCloudinary(req.file.buffer, "hackathon/applications/internships", "auto");
        }

        const application = await AppliedInternship.create({
            user_ID: req.user.id,
            internship_ID,
            cv_url
        });

        res.status(201).json({ message: "Applied to internship successfully", application });
    } catch (error) {
        console.error("Error applying to internship:", error);
        res.status(500).json({ message: "Server error or you have already applied." });
    }
};

const applyForJob = async (req, res) => {
    try {
        const job_ID = req.params.id;
        let cv_url = null;

        if (req.file) {
            cv_url = await uploadToCloudinary(req.file.buffer, "hackathon/applications/jobs", "auto");
        }

        const application = await AppliedJob.create({
            user_ID: req.user.id,
            job_ID,
            cv_url
        });

        res.status(201).json({ message: "Applied to job successfully", application });
    } catch (error) {
        console.error("Error applying to job:", error);
        res.status(500).json({ message: "Server error or you have already applied." });
    }
};

const applyForProblem = async (req, res) => {
    try {
        const problem_ID = req.params.id;
        const { time, budget, solution } = req.body;
        let cv_url = null;

        if (req.file) {
            cv_url = await uploadToCloudinary(req.file.buffer, "hackathon/applications/problems", "auto");
        }

        // A problem application must write to BOTH the applied_problem table
        // (the application record) AND the solution table (the submitted solution).
        const { application, solution } = await sequelize.transaction(async (t) => {
            const application = await AppliedProblem.create({
                user_ID: req.user.id,
                problem_ID,
                cv_url
            }, { transaction: t });

            const solution = await Solution.create({
                user_ID: req.user.id,
                problem_ID,
                isPdfAvailable: !!cv_url,
                pdf: cv_url,
                url: req.body.url || null,
                time: req.body.time || null,
                budget: req.body.budget || null,
                solution: req.body.solution || "Solution submitted as attached document."
            }, { transaction: t });

            return { application, solution };
        });

<<<<<<< HEAD
        // Map and insert exactly into the custom Solution relational table 
        await Solution.create({
            user_ID: req.user.id,
            problem_ID: problem_ID,
            isPdfAvailable: !!cv_url,
            pdf: cv_url,
            url: null,
            time: time || null,
            budget: budget ? parseFloat(budget) : null,
            solution: solution || 'Included in PDF'
        });

        res.status(201).json({ message: "Applied to problem successfully", application });
=======
        res.status(201).json({ message: "Applied to problem successfully", application, solution });
>>>>>>> 9f9f9b43e92a87ec176f52a0bfa1e879aa78a121
    } catch (error) {
        console.error("Error applying to problem:", error);
        res.status(500).json({ message: "Server error or you have already applied." });
    }
};

module.exports = {
    applyForInternship,
    applyForJob,
    applyForProblem
};
