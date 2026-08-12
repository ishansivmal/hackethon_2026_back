const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const PasswordResetToken = require("../models/PasswordResetToken");

const VALID_ROLES = ["user", "admin", "company", "jobseeker"];

// =========================
// GET ALL USERS
// =========================

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "name", "email", "role", "createdAt"],
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
// UPDATE USER ROLE
// =========================

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
                message: "Invalid role. Allowed roles: user, admin, company, jobseeker"
            });
        }

        if (Number(id) === Number(req.user.id)) {
            return res.status(400).json({
                message: "You cannot change your own role"
            });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.role = role;

        await user.save();

        // Invalidate existing sessions so the new role applies on next login
        await RefreshToken.destroy({
            where: { userId: user.id }
        });

        res.status(200).json({
            message: "User role updated",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
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

module.exports = {
    getAllUsers,
    updateUserRole,
    deleteUser
};
