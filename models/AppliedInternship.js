'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AppliedInternship extends Model {
        static associate(models) {

            // Belongs to User (FK: user_ID → Users.id)
            AppliedInternship.belongsTo(models.User, {
                foreignKey: 'user_ID',
                targetKey: 'id',
                as: 'user'
            });

            // Belongs to Internship (FK: internship_ID → internship.id)
            AppliedInternship.belongsTo(models.Internship, {
                foreignKey: 'internship_ID',
                targetKey: 'id',
                as: 'internship'
            });
        }
    }

    AppliedInternship.init(
        {
            applied_internship_ID: {
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

            internship_ID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'internship',
                    key: 'id'
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
            modelName: 'AppliedInternship',
            tableName: 'applied_internship',
            timestamps: false,

            // Prevent same user applying to same internship twice
            indexes: [
                {
                    unique: true,
                    fields: ['user_ID', 'internship_ID']
                }
            ]
        }
    );

    return AppliedInternship;
};
