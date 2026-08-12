'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class PasswordResetToken extends Model {

        static associate(models) {
            PasswordResetToken.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
        }
    }

    PasswordResetToken.init(
        {
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
        },
        {
            sequelize,
            modelName: 'PasswordResetToken',
            tableName: 'PasswordResetTokens',
            timestamps: true
        }
    );

    return PasswordResetToken;
};
