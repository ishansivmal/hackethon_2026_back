const express = require("express");
const sequelize = require("./config/database");
const User = require("./models/User");
const chalk = require("chalk");


const app = express();
app.use(express.json());
require("dotenv").config();

const PORT = 5000;

// Routes
const authRoutes = require("./routes/auth.routes");



// Routes
app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Hackathon Backend is running!");
});

app.post("/test", (req, res) => {
    console.log(req.body);

    res.json({
        message: "Data received!",
        data: req.body
    });
});

// Connect database
sequelize
    .sync()
    .then(() => {
        console.log(chalk.yellow("✓ Database connected successfully!"));
    })
    .catch((error) => {
        console.error(
            chalk.red("✗ Unable to connect to the database:"),
            error
        );
    });

// Start server
app.listen(PORT, () => {
    console.log(
        chalk.yellow(`✓ Server is running on http://localhost:${PORT}`)
    );
});