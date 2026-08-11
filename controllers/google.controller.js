const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const issueTokens = require("../utils/issueTokens");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                message: "Google ID token is required"
            });
        }

        // Verify the ID token from Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload.email_verified) {
            return res.status(400).json({
                message: "Google email is not verified"
            });
        }

        const email = payload.email;
        const name = payload.name || "Google User";

        // Find existing user by email, or create one (signup)
        let user = await User.findOne({
            where: { email }
        });

        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                name,
                email,
                password: hashedPassword
            });
        }

        // Issue access and refresh tokens
        const { accessToken, refreshToken } = await issueTokens(user);

        res.status(200).json({
            message: "Google sign-in successful",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(401).json({
            message: "Invalid Google token"
        });
    }
};

module.exports = { googleAuth };
