'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class User extends Model {

        static associate(models) {

            User.hasMany(models.RefreshToken, {
                foreignKey: 'userId',
                as: 'refreshTokens',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.PasswordResetToken, {
                foreignKey: 'userId',
                as: 'passwordResetTokens',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.EmailVerificationToken, {
                foreignKey: 'userId',
                as: 'emailVerificationTokens',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.Internship, {
                foreignKey: 'user_ID',
                as: 'internships',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.Problem, {
                foreignKey: 'user_ID',
                as: 'problems',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.Job, {
                foreignKey: 'user_ID',
                as: 'jobs',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.Solution, {
                foreignKey: 'user_ID',
                as: 'solutions',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.AppliedInternship, {
                foreignKey: 'user_ID',
                as: 'appliedInternships',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.AppliedJob, {
                foreignKey: 'user_ID',
                as: 'appliedJobs',
                onDelete: 'CASCADE',
                hooks: true
            });

            User.hasMany(models.AppliedProblem, {
                foreignKey: 'user_ID',
                as: 'appliedProblems',
                onDelete: 'CASCADE',
                hooks: true
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