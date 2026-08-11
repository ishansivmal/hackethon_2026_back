require("dotenv").config();

const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const User = require("../models/User");

const seedUsers = async () => {
    try {
        // Connect to database
        await sequelize.authenticate();

        console.log("✓ Database connected");

        // =========================
        // ADMIN USER
        // =========================

        const adminPassword = await bcrypt.hash(
            "Admin123456!",
            10
        );

        const [admin, adminCreated] = await User.findOrCreate({
            where: {
                email: "ishansivmal@gmail.com"
            },
            defaults: {
                name: "Ishan Sivmal",
                email: "ishansivmal@gmail.com",
                password: adminPassword,
                role: "admin"
            }
        });

        if (adminCreated) {
            console.log("✓ Admin user created");
        } else {
            console.log("→ Admin user already exists");
        }


        // =========================
        // NORMAL USER
        // =========================

        const userPassword = await bcrypt.hash(
            "User123456!",
            10
        );

        const [user, userCreated] = await User.findOrCreate({
            where: {
                email: "sivmalishan@gmail.com"
            },
            defaults: {
                name: "Sivmal Ishan",
                email: "sivmalishan@gmail.com",
                password: userPassword,
                role: "user"
            }
        });

        if (userCreated) {
            console.log("✓ Normal user created");
        } else {
            console.log("→ Normal user already exists");
        }


        console.log("\n✓ Seeding completed successfully");

        await sequelize.close();

    } catch (error) {
        console.error("✗ Seeding failed:");
        console.error(error);

        process.exit(1);
    }
};

seedUsers();