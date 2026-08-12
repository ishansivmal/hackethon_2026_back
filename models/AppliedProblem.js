'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AppliedProblem extends Model {
        static associate(models) {

            // Application belongs to one User
            AppliedProblem.belongsTo(models.User, {
                foreignKey: 'user_ID',
                targetKey: 'id',
                as: 'user'
            });

            // Application belongs to one Problem
            AppliedProblem.belongsTo(models.Problem, {
                foreignKey: 'problem_ID',
                targetKey: 'problem_ID',
                as: 'problem'
            });
        }
    }

    AppliedProblem.init(
        {
            applied_problem_ID: {
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

            cv_url: {
                type: DataTypes.STRING,
                allowNull: true
            },

            isSelected: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        },
        {
            sequelize,
            modelName: 'AppliedProblem',
            tableName: 'applied_problem',
            timestamps: false,

            // Prevent the same user from applying
            // to the same problem more than once
            indexes: [
                {
                    unique: true,
                    fields: ['user_ID', 'problem_ID']
                }
            ]
        }
    );

    return AppliedProblem;
};
