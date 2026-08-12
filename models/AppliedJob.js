'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AppliedJob extends Model {
        static associate(models) {

            // Application belongs to one User
            AppliedJob.belongsTo(models.User, {
                foreignKey: 'user_ID',
                targetKey: 'id',
                as: 'user'
            });

            // Application belongs to one Job
            AppliedJob.belongsTo(models.Job, {
                foreignKey: 'job_ID',
                targetKey: 'job_ID',
                as: 'job'
            });
        }
    }

    AppliedJob.init(
        {
            applied_job_ID: {
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

            job_ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'job',
                    key: 'job_ID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },

            isSelected: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        },
        {
            sequelize,
            modelName: 'AppliedJob',
            tableName: 'applied_job',
            timestamps: false,

            // Prevent the same user from applying
            // to the same job more than once
            indexes: [
                {
                    unique: true,
                    fields: ['user_ID', 'job_ID']
                }
            ]
        }
    );

    return AppliedJob;
};
