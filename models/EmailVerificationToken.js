'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class EmailVerificationToken extends Model {

        static associate(models) {
            EmailVerificationToken.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
        }
    }

    EmailVerificationToken.init(
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
            modelName: 'EmailVerificationToken',
            tableName: 'EmailVerificationTokens',
            timestamps: true
        }
    );

    return EmailVerificationToken;
};
