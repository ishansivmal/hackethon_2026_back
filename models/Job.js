'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class Job extends Model {

        static associate(models) {

            // A job belongs to one user
            Job.belongsTo(models.User, {
                foreignKey: 'user_ID',
                targetKey: 'id',
                as: 'user'
            });

            // Job has many applications
            Job.hasMany(models.AppliedJob, {
                foreignKey: 'job_ID',
                sourceKey: 'job_ID',
                as: 'applications'
            });

        }
    }

    Job.init(
        {
            job_ID: {
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

            position: {
                type: DataTypes.STRING,
                allowNull: false
            },

            photoUrl: {
                type: DataTypes.STRING,
                allowNull: true
            },

            requirements: {
                type: DataTypes.TEXT,
                allowNull: false
            },

            jobType: {
                type: DataTypes.ENUM(
                    'full-time',
                    'part-time',
                    'contract',
                    'internship',
                    'remote'
                ),
                allowNull: false
            },

            location: {
                type: DataTypes.STRING,
                allowNull: false
            },

            salary: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Job',
            tableName: 'job',
            timestamps: false
        }
    );

    return Job;
};
