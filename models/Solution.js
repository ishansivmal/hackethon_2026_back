'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Solution extends Model {
        static associate(models) {

            // Solution belongs to one user
            Solution.belongsTo(models.User, {
                foreignKey: 'user_ID',
                targetKey: 'id',
                as: 'user'
            });

            // Solution belongs to one problem
            Solution.belongsTo(models.Problem, {
                foreignKey: 'problem_ID',
                targetKey: 'problem_ID',
                as: 'problem'
            });
        }
    }

    Solution.init(
        {
            solution_ID: {
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

            problem_ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'problem',
                    key: 'problem_ID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },

            isPdfAvailable: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            pdf: {
                type: DataTypes.STRING,
                allowNull: true
            },

            url: {
                type: DataTypes.STRING,
                allowNull: true
            },

            time: {
                type: DataTypes.STRING,
                allowNull: true
            },

            budget: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },

            solution: {
                type: DataTypes.TEXT,
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Solution',
            tableName: 'solution',
            timestamps: false
        }
    );

    return Solution;
};
