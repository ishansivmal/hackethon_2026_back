const { RefreshToken } = require("../models");

const { generateAccessToken, generateRefreshToken } = require("./jwt");

const issueTokens = async (user) => {
    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        )
    });

    return { accessToken, refreshToken };
};

module.exports = issueTokens;
