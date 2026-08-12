const request = require("supertest");
const app = require("../../app");

jest.mock("../../config/email", () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: "mocked" })
}));

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────

describe("Auth - Register", () => {

    // ── Success ────────────────────────────────────────────────────────────────

    test("201 - should register a new user successfully", async () => {
        const uniqueEmail = `testuser_${Date.now()}@example.com`;

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Test User",
                email: uniqueEmail,
                password: "Password@123"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message", "User registered successfully. A confirmation email has been sent to your inbox. Please verify your email before logging in.");
        expect(res.body.user).toHaveProperty("email", uniqueEmail);
        expect(res.body.user).toHaveProperty("role");
        expect(res.body.user).toHaveProperty("emailVerified", false);
        expect(res.body.user).not.toHaveProperty("password");
    });

    test("201 - should send a confirmation email to the new user", async () => {
        const uniqueEmail = `emailcheck_${Date.now()}@example.com`;

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Email Tester",
                email: uniqueEmail,
                password: "Password@123"
            });

        expect(res.statusCode).toBe(201);

        const { sendEmail } = require("../../config/email");

        const call = sendEmail.mock.calls.find(
            (opts) => opts[0].to === uniqueEmail
        );

        expect(call).toBeDefined();
        expect(call[0].subject).toMatch(/confirm your email/i);
        expect(call[0].html).toMatch(/token=[a-f0-9]{64}/);
        expect(call[0].html).toMatch(/Confirm my email/);
    });

    test("201 - should register a company user with the company role", async () => {
        const uniqueEmail = `company_${Date.now()}@example.com`;

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Tech Company",
                email: uniqueEmail,
                password: "Password@123",
                role: "company"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.user).toHaveProperty("role", "company");
    });

    test("201 - should default to jobseeker role when no role provided", async () => {
        const uniqueEmail = `jobseeker_${Date.now()}@example.com`;

        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Job Hunter",
                email: uniqueEmail,
                password: "Password@123"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.user).toHaveProperty("role", "jobseeker");
    });

    test("400 - should fail with an invalid role", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Hacker",
                email: `hacker_${Date.now()}@example.com`,
                password: "Password@123",
                role: "admin"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Invalid role. Allowed roles: company, jobseeker");
    });

    // ── Validation Failures ────────────────────────────────────────────────────

    test("400 - should fail when name is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                email: "noname@example.com",
                password: "Password@123"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Name, email and password are required");
    });

    test("400 - should fail when email is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Test User",
                password: "Password@123"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Name, email and password are required");
    });

    test("400 - should fail when password is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Test User",
                email: "nopwd@example.com"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Name, email and password are required");
    });

    test("400 - should fail with invalid email format", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Test User",
                email: "not-an-email",
                password: "Password@123"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Please provide a valid email address");
    });

    test("400 - should fail with weak password", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Test User",
                email: "weakpwd@example.com",
                password: "1234"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Password must be at least 8 characters/);
    });

    // ── Conflict ───────────────────────────────────────────────────────────────

    test("409 - should fail when email is already registered", async () => {
        const email = `duplicate_${Date.now()}@example.com`;

        // Register once
        await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "First", email, password: "Password@123" });

        // Try registering again with same email
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "Second", email, password: "Password@123" });

        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty("message", "Email already registered");
    });
});
