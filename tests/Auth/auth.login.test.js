const request = require("supertest");
const app = require("../../app");

jest.mock("../../config/email", () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: "mocked" })
}));

const confirmLatestUser = require("../helpers/confirmUser");

// ─── POST /api/v1/auth/login ───────────────────────────────────────────────────

describe("Auth - Login", () => {

    // Shared test account — registered once before all login tests
    const testEmail = `login_test_${Date.now()}@example.com`;
    const testPassword = "Password@123";

    beforeAll(async () => {
        await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "Login Tester", email: testEmail, password: testPassword });

        await confirmLatestUser(app, testEmail);
    });

    // ── Success ────────────────────────────────────────────────────────────────

    test("200 - should login with correct credentials", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: testEmail, password: testPassword });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Login successful");
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body).toHaveProperty("refreshToken");
        expect(res.body.user).toHaveProperty("email", testEmail);
    });

    // ── Wrong Credentials ──────────────────────────────────────────────────────

    test("401 - should fail with wrong password", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: testEmail, password: "WrongPass@999" });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("message", "Invalid email or password");
    });

    test("401 - should fail with non-existent email", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "ghost@nowhere.com", password: "Password@123" });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("message", "Invalid email or password");
    });

    // ── Missing Fields ─────────────────────────────────────────────────────────

    test("400 - should fail when email is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ password: "Password@123" });

        expect(res.statusCode).toBe(400);
    });

    test("400 - should fail when password is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: testEmail });

        expect(res.statusCode).toBe(400);
    });
});
