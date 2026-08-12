const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false
    },

    role: {
        type: DataTypes.STRING,
        defaultValue: "jobseeker"
    },

    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

// Relationship
const RefreshToken = require("./RefreshToken");
const PasswordResetToken = require("./PasswordResetToken");
const EmailVerificationToken = require("./EmailVerificationToken");

User.hasMany(RefreshToken, {
    foreignKey: "userId"
});

RefreshToken.belongsTo(User, {
    foreignKey: "userId"
});

User.hasMany(PasswordResetToken, {
    foreignKey: "userId"
});

PasswordResetToken.belongsTo(User, {
    foreignKey: "userId"
});

User.hasMany(EmailVerificationToken, {
    foreignKey: "userId"
});

EmailVerificationToken.belongsTo(User, {
    foreignKey: "userId"
});

module.exports = User;