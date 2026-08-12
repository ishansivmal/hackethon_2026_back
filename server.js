require("dotenv").config();

const app = require("./app");
const { sequelize } = require('./models');
const chalk = require("chalk");

const PORT = process.env.PORT || 5000;

// Connect database first
sequelize
    .sync({ alter: true })
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