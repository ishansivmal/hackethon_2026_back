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
        defaultValue: "user"
    }
});

// Relationship
const RefreshToken = require("./RefreshToken");

User.hasMany(RefreshToken, {
    foreignKey: "userId"
});

RefreshToken.belongsTo(User, {
    foreignKey: "userId"
});

module.exports = User;