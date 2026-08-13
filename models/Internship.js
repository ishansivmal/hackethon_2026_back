'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class Internship extends Model {

        static associate(models) {
            Internship.belongsTo(models.User, {
                foreignKey: 'user_ID',
                targetKey: 'id',
                as: 'user'
            });

            // Internship has many applications
            Internship.hasMany(models.AppliedInternship, {
                foreignKey: 'internship_ID',
                as: 'applications'
            });
        }
    }

    Internship.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },

            user_ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },

            title: {
                type: DataTypes.STRING,
                allowNull: false
            },

            photoUrl: {
                type: DataTypes.STRING,
                allowNull: true
            },

            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },

            requirements: {
                type: DataTypes.TEXT,
                allowNull: false
            },

            duration: {
                type: DataTypes.STRING,
                allowNull: false
            },

            location: {
                type: DataTypes.STRING,
                allowNull: false
            },

            internType: {
                type: DataTypes.ENUM('physical', 'hybrid', 'online'),
                allowNull: false
            },

            isPaid: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            deadline: {
                type: DataTypes.DATE,
                allowNull: false
            },

            isOpen: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            sequelize,
            modelName: 'Internship',
            tableName: 'internship',
            timestamps: true
        }
    );

    return Internship;
};