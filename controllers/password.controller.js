const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sendEmail } = require("../config/email");
const isValidPassword = require("../utils/validatePassword");
const renderTemplate = require("../utils/renderTemplate");

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// =========================
// FORGOT PASSWORD
// =========================

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        const user = await User.findOne({
            where: { email }
        });

        // Always respond the same way to avoid leaking which emails exist
        if (!user) {
            return res.status(200).json({
                message:
                    "If an account exists for this email, a password reset link has been sent."
            });
        }

        // Generate and store a reset token (only its hash is saved)
        const rawToken = crypto.randomBytes(32).toString("hex");

        await PasswordResetToken.create({
            token: hashToken(rawToken),
            userId: user.id,
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
        });

        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

        const html = renderTemplate("passwordReset", {
            userName: user.name,
            resetUrl
        });

        await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            html
        });

        res.status(200).json({
            message:
                "If an account exists for this email, a password reset link has been sent."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// =========================
// RESET PASSWORD
// =========================

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Reset token is required"
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                message: "New password is required"
            });
        }

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters and contain uppercase, lowercase, number and special character"
            });
        }

        const resetRecord = await PasswordResetToken.findOne({
            where: { token: hashToken(token) }
        });

        if (!resetRecord || resetRecord.expiresAt < new Date()) {
            if (resetRecord) {
                await resetRecord.destroy();
            }

            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        const user = await User.findByPk(resetRecord.userId);

        if (!user) {
            await resetRecord.destroy();

            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        // Update the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        await user.save();

        // Invalidate existing sessions and consume the reset token
        await RefreshToken.destroy({
            where: { userId: user.id }
        });

        await resetRecord.destroy();

        res.status(200).json({
            message: "Password reset successful"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    forgotPassword,
    resetPassword
};
