const { Internship, Job, Problem, User } = require("../models");

const MAX_PAGE_SIZE = 50;

const readPaging = (req) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
    return { page, pageSize };
};

// Runs a count + find with the same filters, then clamps the page so an
// out-of-range value never returns an empty-but-valid response.
const paginate = async (model, include, order, page, pageSize) => {
    const total = await model.count();
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);

    const rows = await model.findAll({
        include,
        order,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
    });

    return { rows, total, page: currentPage, pageSize, totalPages };
};

const getInternships = async (req, res) => {
    try {
        const { page, pageSize } = readPaging(req);

        const data = await paginate(
            Internship,
            [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
            [["id", "DESC"]],
            page,
            pageSize
        );

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getJobs = async (req, res) => {
    try {
        const { page, pageSize } = readPaging(req);

        const data = await paginate(
            Job,
            [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
            [["job_ID", "DESC"]],
            page,
            pageSize
        );

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getProblems = async (req, res) => {
    try {
        const { page, pageSize } = readPaging(req);

        const data = await paginate(
            Problem,
            [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
            [["problem_ID", "DESC"]],
            page,
            pageSize
        );

        res.status(200).json(data);
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
