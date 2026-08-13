require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const companyRoutes = require("./routes/company.routes");
const publicRoutes = require("./routes/public.routes");
const customerRoutes = require("./routes/customer.routes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/customer", customerRoutes);

app.get("/", (req, res) => {
    res.send("Hackathon Backend is running!");
});

module.exports = app;
