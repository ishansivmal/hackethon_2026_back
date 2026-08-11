const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PasswordResetToken = sequelize.define("PasswordResetToken", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    token: {
        type: DataTypes.STRING(64),
        allowNull: false
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = PasswordResetToken;
