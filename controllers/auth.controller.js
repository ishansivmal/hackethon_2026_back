const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { User, RefreshToken, EmailVerificationToken } = require("../models");

const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const issueTokens = require("../utils/issueTokens");
const isValidPassword = require("../utils/validatePassword");
const { sendEmail } = require("../config/email");
const renderTemplate = require("../utils/renderTemplate");

const VALID_REGISTER_ROLES = ["company", "jobseeker"];

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");


// =========================
// REGISTER
// =========================

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        // Validate role (defaults to jobseeker)
        if (role && !VALID_REGISTER_ROLES.includes(role)) {
            return res.status(400).json({
                message: "Invalid role. Allowed roles: company, jobseeker"
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        // Strong password validation
        if (!isValidPassword(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters and contain uppercase, lowercase, number and special character"
            });
        }

        // Check whether email already exists
        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (email must be verified before they can log in)
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "jobseeker",
            emailVerified: false
        });

        // Generate and store a verification token (only its hash is saved)
        const rawToken = crypto.randomBytes(32).toString("hex");

        await EmailVerificationToken.create({
            token: hashToken(rawToken),
            userId: user.id,
            expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS)
        });

        const confirmUrl =
            `${process.env.FRONTEND_URL}/confirm-email?token=${rawToken}`;

        const html = renderTemplate("emailConfirmation", {
            userName: user.name,
            confirmUrl
        });

        await sendEmail({
            to: user.email,
            subject: "Confirm your email — Hackathon 2026",
            html
        });

        // Send response
        res.status(201).json({
            message:
                "User registered successfully. A confirmation email has been sent to your inbox. Please verify your email before logging in.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
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
// LOGIN
// =========================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Email must be verified before the user can log in
        if (!user.emailVerified) {
            return res.status(403).json({
                message:
                    "Please verify your email address before logging in. A confirmation link was sent to your email."
            });
        }

        // Issue access and refresh tokens
        const { accessToken, refreshToken } = await issueTokens(user);

        // Send tokens to client
        res.status(200).json({
            message: "Login successful",

            accessToken: accessToken,

            refreshToken: refreshToken,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message || "Server error"
        });
    }
};

// =========================
// CONFIRM EMAIL
// =========================

const confirmEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Verification token is required"
            });
        }

        const verificationRecord = await EmailVerificationToken.findOne({
            where: { token: hashToken(token) }
        });

        if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
            if (verificationRecord) {
                await verificationRecord.destroy();
            }

            return res.status(400).json({
                message: "Invalid or expired verification token"
            });
        }

        const user = await User.findByPk(verificationRecord.userId);

        if (!user) {
            await verificationRecord.destroy();

            return res.status(400).json({
                message: "Invalid or expired verification token"
            });
        }

        user.emailVerified = true;

        await user.save();

        await verificationRecord.destroy();

        res.status(200).json({
            message: "Email confirmed successfully. You can now log in.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
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
// REFRESH ACCESS TOKEN
// =========================

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // 1. Check if refresh token was provided
        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required"
            });
        }

        // 2. Verify the refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // 3. Find the refresh token in database
        const storedToken = await RefreshToken.findOne({
            where: {
                token: refreshToken
            }
        });

        if (!storedToken) {
            return res.status(401).json({
                message: "Refresh token not found"
            });
        }

        // 4. Check database expiration
        if (storedToken.expiresAt < new Date()) {
            await storedToken.destroy();

            return res.status(401).json({
                message: "Refresh token expired"
            });
        }

        // 5. Re-fetch the user so role/account data stays current
        const user = await User.findByPk(decoded.id);

        if (!user) {
            await storedToken.destroy();

            return res.status(401).json({
                message: "User no longer exists"
            });
        }

        // 6. Create new access token from fresh user data
        const newAccessToken = generateAccessToken(user);

        // 7. Create new refresh token
        const newRefreshToken = generateRefreshToken(user);

        // 8. Replace old refresh token with new one
        storedToken.token = newRefreshToken;

        storedToken.expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await storedToken.save();

        // 9. Return both tokens
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error(error);

        return res.status(401).json({
            message: "Invalid or expired refresh token"
        });
    }
};

// =========================
// LOGOUT
// =========================
const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // Check if refresh token was provided
        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token required"
            });
        }

        // Find and delete the refresh token
        const deletedToken = await RefreshToken.destroy({
            where: {
                token: refreshToken
            }
        });

        // Token was not found
        if (deletedToken === 0) {
            return res.status(404).json({
                message: "Refresh token not found"
            });
        }

        res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message || "Server error"
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    confirmEmail,
    refreshAccessToken,
    logoutUser
};
    
