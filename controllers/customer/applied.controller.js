const { Sequelize } = require("sequelize");
const sequelize = require("../../config/database");

const AppliedInternship = require("../../models/AppliedInternship")(sequelize, Sequelize.DataTypes);
const AppliedJob = require("../../models/AppliedJob")(sequelize, Sequelize.DataTypes);
const AppliedProblem = require("../../models/AppliedProblem")(sequelize, Sequelize.DataTypes);

const getAppliedRecord = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const appliedInternships = await AppliedInternship.findAll({ where: { user_ID: userId }, attributes: ['internship_ID'] });
        const appliedJobs = await AppliedJob.findAll({ where: { user_ID: userId }, attributes: ['job_ID'] });
        const appliedProblems = await AppliedProblem.findAll({ where: { user_ID: userId }, attributes: ['problem_ID'] });
        
        res.status(200).json({
            internships: appliedInternships.map(ai => ai.internship_ID),
            jobs: appliedJobs.map(aj => aj.job_ID),
            problems: appliedProblems.map(ap => ap.problem_ID)
        });
    } catch (error) {
        console.error("Error fetching applied records:", error);
        res.status(500).json({ message: "Server error preventing fetching applied records" });
    }
};

module.exports = {
    getAppliedRecord
};
