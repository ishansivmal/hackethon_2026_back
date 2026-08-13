const bcrypt = require("bcryptjs");
const { Op, Sequelize } = require("sequelize");
const { User, Company, RefreshToken, PasswordResetToken } = require("../models");

const VALID_ROLES = ["user", "admin", "company", "jobseeker"];

const MAX_PAGE_SIZE = 50;

const readPaging = (req) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
    return { page, pageSize };
};

// =========================
// GET ALL USERS
// =========================

const getAllUsers = async (req, res) => {
    try {
        const attributes = ["id", "name", "email", "role", "emailVerified", "createdAt"];

        // Backward compatible: without a page param, return the full list.
        if (req.query.page === undefined) {
            const users = await User.findAll({
                attributes,
                order: [["id", "ASC"]]
            });
            return res.status(200).json({ users });
        }

        const { page, pageSize } = readPaging(req);
        const { search, role } = req.query;

        const where = {};

        if (role && role !== "all") {
            where.role = role;
        }

        if (search && String(search).trim()) {
            const term = `%${String(search).trim()}%`;
            where[Op.or] = [
                { name: { [Op.like]: term } },
                { email: { [Op.like]: term } }
            ];
        }

        const total = await User.count({ where });

        // Unfiltered role breakdown for the header badges.
        const roleRows = await User.findAll({
            attributes: ["role", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
            group: ["role"],
            raw: true
        });
        const counts = { total: 0, admin: 0, user: 0, jobseeker: 0, company: 0 };

        roleRows.forEach((row) => {
            const key = row.role;
            if (key in counts) counts[key] = Number(row.count) || 0;
            counts.total += Number(row.count) || 0;
        });

        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const currentPage = Math.min(page, totalPages);

        const users = await User.findAll({
            attributes,
            where,
            order: [["id", "ASC"]],
            limit: pageSize,
            offset: (currentPage - 1) * pageSize
        });

        res.status(200).json({
            users,
            total,
            page: currentPage,
            pageSize,
            totalPages,
            counts
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// CREATE NEW ADMIN USER
// =========================

const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        const existingUser = await User.findOne({ where: { email: email.trim() } });
        if (existingUser) {
            return res.status(400).json({
                message: "Email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            email: email.trim(),
            password: hashedPassword,
            role: "admin",
            emailVerified: true
        });

        res.status(201).json({
            message: "Admin user created successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                emailVerified: newUser.emailVerified,
                createdAt: newUser.createdAt
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
// UPDATE USER DETAILS (NAME & EMAIL ONLY - ROLE IS FIXED)
// =========================

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (name && name.trim()) {
            user.name = name.trim();
        }

        if (email && email.trim() && email.trim() !== user.email) {
            const existingEmail = await User.findOne({ where: { email: email.trim() } });
            if (existingEmail && existingEmail.id !== user.id) {
                return res.status(400).json({
                    message: "Email is already in use by another user"
                });
            }
            user.email = email.trim();
        }

        await user.save();

        res.status(200).json({
            message: "User details updated successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt
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
// UPDATE USER ROLE (FIXED / DISABLED)
// =========================

const updateUserRole = async (req, res) => {
    return res.status(400).json({
        message: "User roles are fixed and cannot be changed"
    });
};

// =========================
// DELETE USER
// =========================

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === Number(req.user.id)) {
            return res.status(400).json({
                message: "You cannot delete your own account"
            });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Remove related records first
        await RefreshToken.destroy({
            where: { userId: user.id }
        });

        await PasswordResetToken.destroy({
            where: { userId: user.id }
        });

        await user.destroy();

        res.status(200).json({
            message: "User deleted"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// GET ALL COMPANIES
// =========================

const getAllCompanies = async (req, res) => {
    try {
        // Every User with role "company" is a company. Registration currently
        // only creates the User row, so backfill a linked Company profile for
        // any company-role user that does not have one yet. This makes them
        // appear (and become manageable) in Company Management.
        const companyUsers = await User.findAll({
            where: { role: "company" },
            attributes: ["id", "name", "email"]
        });

        const existingCompanies = await Company.findAll({
            where: { user_ID: { [Op.ne]: null } },
            attributes: ["user_ID"]
        });

        const linkedUserIds = new Set(existingCompanies.map((c) => c.user_ID));

        for (const user of companyUsers) {
            if (!linkedUserIds.has(user.id)) {
                await Company.create({
                    user_ID: user.id,
                    name: user.name,
                    email: user.email,
                    category: "Software & IT",
                    status: "Pending"
                });
            }
        }

        const attributes = ["id", "name", "email", "category", "status", "website", "location", "description", "createdAt"];

        // Backward compatible: without a page param, return the full list.
        if (req.query.page === undefined) {
            const companies = await Company.findAll({
                attributes,
                order: [["id", "ASC"]]
            });
            return res.status(200).json({ companies });
        }

        const { page, pageSize } = readPaging(req);
        const { status } = req.query;

        const where = {};

        if (status && status !== "all") {
            const normalized = String(status).toLowerCase();
            where.status = normalized.charAt(0).toUpperCase() + normalized.slice(1);
        }

        const total = await Company.count({ where });

        // Unfiltered status breakdown for the header badges / filter tabs.
        const statusRows = await Company.findAll({
            attributes: ["status", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
            group: ["status"],
            raw: true
        });
        const counts = { total: 0, pending: 0, approved: 0, suspended: 0 };

        statusRows.forEach((row) => {
            const key = String(row.status || "").toLowerCase();
            if (key in counts) counts[key] = Number(row.count) || 0;
            counts.total += Number(row.count) || 0;
        });

        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const currentPage = Math.min(page, totalPages);

        const companies = await Company.findAll({
            attributes,
            where,
            order: [["id", "ASC"]],
            limit: pageSize,
            offset: (currentPage - 1) * pageSize
        });

        res.status(200).json({
            companies,
            total,
            page: currentPage,
            pageSize,
            totalPages,
            counts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// CREATE NEW COMPANY
// =========================

const createCompany = async (req, res) => {
    try {
        const { name, email, category, status, website, location, description } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Company name and email are required"
            });
        }

        const newCompany = await Company.create({
            name: name.trim(),
            email: email.trim(),
            category: category ? category.trim() : "Software & IT",
            status: status ? status : "Pending",
            website: website ? website.trim() : null,
            location: location ? location.trim() : null,
            description: description ? description.trim() : null
        });

        res.status(201).json({
            message: "Company created successfully",
            company: newCompany
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// UPDATE COMPANY DETAILS
// =========================

const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, category, status, website, location, description } = req.body;

        const company = await Company.findByPk(id);

        if (!company) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        if (name && name.trim()) company.name = name.trim();
        if (email && email.trim()) company.email = email.trim();
        if (category !== undefined) company.category = category;
        if (status !== undefined) company.status = status;
        if (website !== undefined) company.website = website;
        if (location !== undefined) company.location = location;
        if (description !== undefined) company.description = description;

        await company.save();

        res.status(200).json({
            message: "Company details updated successfully",
            company
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// UPDATE COMPANY STATUS
// =========================

const updateCompanyStatus = async (req, res) => {
    return updateCompany(req, res);
};

// =========================
// DELETE COMPANY
// =========================

const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const company = await Company.findByPk(id);

        if (!company) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        if (company.status && company.status.toLowerCase() !== "pending") {
            return res.status(400).json({
                message: "Only pending companies can be deleted. Approved companies cannot be deleted."
            });
        }

        // Remove the linked account (User row) too so a deleted company
        // account is not silently recreated by the company backfill.
        if (company.user_ID) {
            await RefreshToken.destroy({ where: { userId: company.user_ID } });
            await PasswordResetToken.destroy({ where: { userId: company.user_ID } });
            await User.destroy({ where: { id: company.user_ID } });
        }

        await company.destroy();

        res.status(200).json({
            message: "Company deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser,
    getAllCompanies,
    createCompany,
    updateCompany,
    updateCompanyStatus,
    deleteCompany
};
