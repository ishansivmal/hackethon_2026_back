const { Internship, Job, Problem, User } = require("../models");

const getInternships = async (req, res) => {
    try {
        const internships = await Internship.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });
        res.status(200).json(internships);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getProblems = async (req, res) => {
    try {
        const problems = await Problem.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });
        res.status(200).json(problems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getInternships,
    getJobs,
    getProblems
};
