const bcrypt = require("bcryptjs");
const { User, Company, RefreshToken, PasswordResetToken } = require("../models");

const VALID_ROLES = ["user", "admin", "company", "jobseeker"];

// =========================
// GET ALL USERS
// =========================

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "name", "email", "role", "emailVerified", "createdAt"],
            order: [["id", "ASC"]]
        });

        res.status(200).json({ users });
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
        const companies = await Company.findAll({
            attributes: ["id", "name", "email", "category", "status", "website", "location", "description", "createdAt"],
            order: [["id", "ASC"]]
        });

        res.status(200).json({ companies });
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
