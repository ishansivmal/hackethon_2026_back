'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class RefreshToken extends Model {

        static associate(models) {
            RefreshToken.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            });
        }
    }

    RefreshToken.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },

            token: {
                type: DataTypes.TEXT,
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
            modelName: 'RefreshToken',
            tableName: 'RefreshTokens',
            timestamps: true
        }
    );

    return RefreshToken;
};