require("dotenv").config();

const app = require("./app");
const { sequelize } = require('./models');
const chalk = require("chalk");

const PORT = process.env.PORT || 5000;

// Connect database first
// NOTE: plain sync() on purpose — sync({ alter: true }) re-adds an anonymous
// unique index on Users.email every boot, which eventually exceeds MySQL's
// 64-key-per-table limit and stops the server from starting.
sequelize
    .sync()
    .then(() => {
        console.log(
            chalk.yellow("✓ Database connected successfully!")
        );

        // Start server ONLY after database connects
        app.listen(PORT, () => {
            console.log(
                chalk.yellow(
                    `✓ Server is running on http://localhost:${PORT}`
                )
            );
        });
    })
    .catch((error) => {
        console.error(
            chalk.red("✗ Unable to connect to the database:"),
            error
        );
    });