const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const issueTokens = require("../utils/issueTokens");
const isValidPassword = require("../utils/validatePassword");


// =========================
// REGISTER
// =========================

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
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

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Send response
        res.status(201).json({
            message: "User registered successfully",
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
// LOGIN
// =========================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

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
                role: user.role
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

        // 5. Create new access token
        const newAccessToken = generateAccessToken({
            id: decoded.id
        });

        // 6. Create new refresh token
        const newRefreshToken = generateRefreshToken({
            id: decoded.id
        });

        // 7. Replace old refresh token with new one
        storedToken.token = newRefreshToken;

        storedToken.expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await storedToken.save();

        // 8. Return both tokens
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
    refreshAccessToken,
    logoutUser
};
    
