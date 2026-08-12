'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class Problem extends Model {

        static associate(models) {

            Problem.belongsTo(models.User, {
                foreignKey: 'user_ID',
                targetKey: 'id',
                as: 'user'
            });

            // Problem has many solutions
            Problem.hasMany(models.Solution, {
                foreignKey: 'problem_ID',
                sourceKey: 'problem_ID',
                as: 'solutions'
            });

            // Problem has many applications
            Problem.hasMany(models.AppliedProblem, {
                foreignKey: 'problem_ID',
                sourceKey: 'problem_ID',
                as: 'applications'
            });

        }
    }

    Problem.init(
        {
            problem_ID: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
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

            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            pdf: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Problem',
            tableName: 'problem',
            timestamps: false
        }
    );

    return Problem;
};