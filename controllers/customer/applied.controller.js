const { Op } = require("sequelize");
const { AppliedInternship, AppliedJob, AppliedProblem, Internship, Job, Problem, User, Solution } = require("../../models");

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

// Returns every internship the current user applied to, joined with the
// full internship record (including the posting company) and the
// application status (isSelected = hired or not).
const getAppliedInternships = async (req, res) => {
    try {
        const userId = req.user.id;

        const applications = await AppliedInternship.findAll({
            where: { user_ID: userId },
            include: [{
                model: Internship,
                as: 'internship',
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }]
            }]
        });

        res.status(200).json(applications);
    } catch (error) {
        console.error("Error fetching applied internships:", error);
        res.status(500).json({ message: "Server error preventing fetching applied internships" });
    }
};

// Returns every job the current user applied to, joined with the full
// job record (including the posting company) and application status.
const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.user.id;

        const applications = await AppliedJob.findAll({
            where: { user_ID: userId },
            include: [{
                model: Job,
                as: 'job',
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }]
            }]
        });

        res.status(200).json(applications);
    } catch (error) {
        console.error("Error fetching applied jobs:", error);
        res.status(500).json({ message: "Server error preventing fetching applied jobs" });
    }
};

// Returns every problem the current user applied to, joined with the
// full problem record (including the posting company), status and the
// user's own submitted solution.
const getAppliedProblems = async (req, res) => {
    try {
        const userId = req.user.id;

        const applications = await AppliedProblem.findAll({
            where: { user_ID: userId },
            include: [{
                model: Problem,
                as: 'problem',
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }]
            }]
        });

        const problemIds = applications.map(a => a.problem_ID);
        let solutions = [];
        if (problemIds.length) {
            solutions = await Solution.findAll({
                where: { user_ID: userId, problem_ID: { [Op.in]: problemIds } }
            });
        }
        const solutionByProblem = new Map(solutions.map(s => [s.problem_ID, s]));

        const payload = applications.map(app => ({
            ...app.toJSON(),
            solution: solutionByProblem.get(app.problem_ID) || null
        }));

        res.status(200).json(payload);
    } catch (error) {
        console.error("Error fetching applied problems:", error);
        res.status(500).json({ message: "Server error preventing fetching applied problems" });
    }
};

module.exports = {
    getAppliedRecord,
    getAppliedInternships,
    getAppliedJobs,
    getAppliedProblems
};
