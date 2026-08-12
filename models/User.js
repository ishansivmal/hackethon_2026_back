'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class User extends Model {

        static associate(models) {

            User.hasMany(models.RefreshToken, {
                foreignKey: 'userId',
                as: 'refreshTokens'
            });

            User.hasMany(models.PasswordResetToken, {
                foreignKey: 'userId',
                as: 'passwordResetTokens'
            });

            User.hasMany(models.EmailVerificationToken, {
                foreignKey: 'userId',
                as: 'emailVerificationTokens'
            });

            User.hasMany(models.Internship, {
                foreignKey: 'user_ID',
                as: 'internships'
            });

            User.hasMany(models.Problem, {
                foreignKey: 'user_ID',
                as: 'problems'
            });

            User.hasMany(models.Job, {
                foreignKey: 'user_ID',
                as: 'jobs'
            });

            User.hasMany(models.Solution, {
                foreignKey: 'user_ID',
                as: 'solutions'
            });

            User.hasMany(models.AppliedInternship, {
                foreignKey: 'user_ID',
                as: 'appliedInternships'
            });

            User.hasMany(models.AppliedJob, {
                foreignKey: 'user_ID',
                as: 'appliedJobs'
            });

            User.hasMany(models.AppliedProblem, {
                foreignKey: 'user_ID',
                as: 'appliedProblems'
            });
        }
    }

    User.init(
        {
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
                defaultValue: 'jobseeker'
            },

            emailVerified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            sequelize,
            modelName: 'User',
            tableName: 'Users',
            timestamps: true
        }
    );

    return User;
};