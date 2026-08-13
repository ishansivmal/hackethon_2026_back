'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Company extends Model {
        static associate(models) {
            Company.belongsTo(models.User, {
                foreignKey: 'user_ID',
                as: 'user',
                onDelete: 'CASCADE',
            });
        }
    }

    Company.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            user_ID: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'Users', key: 'id' }
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false
            },
            category: {
                type: DataTypes.STRING,
                defaultValue: 'Software & IT'
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'Pending'
            },
            website: {
                type: DataTypes.STRING,
                allowNull: true
            },
            location: {
                type: DataTypes.STRING,
                allowNull: true
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Company',
            tableName: 'Companies',
            timestamps: true
        }
    );

    return Company;
};
