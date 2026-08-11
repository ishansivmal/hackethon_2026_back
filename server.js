require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const User = require("./models/User");
const chalk = require("chalk");

const app = express();

app.use(express.json());

app.use(cors());

const PORT = process.env.PORT || 5000;

// Routes
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);

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

// Connect database first
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