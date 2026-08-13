const request = require("supertest");
const app = require("../../app");

jest.mock("../../config/email", () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: "mocked" })
}));

const confirmLatestUser = require("../helpers/confirmUser");

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────

describe("Auth - Logout", () => {

    let validRefreshToken;

    // Register and login to get a real refresh token
    beforeAll(async () => {
        const email = `logout_test_${Date.now()}@example.com`;

        await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "Logout Tester", email, password: "Password@123" });

        await confirmLatestUser(app, email);

        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: "Password@123" });

        validRefreshToken = loginRes.body.refreshToken;
    });

    // ── Success ────────────────────────────────────────────────────────────────

    test("200 - should logout successfully with a valid refresh token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/logout")
            .send({ refreshToken: validRefreshToken });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Logout successful");
    });

    // ── Already Logged Out ─────────────────────────────────────────────────────

    test("404 - should fail when refresh token is already invalidated", async () => {
        // Token was already consumed in the test above
        const res = await request(app)
            .post("/api/v1/auth/logout")
            .send({ refreshToken: validRefreshToken });

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty("message", "Refresh token not found");
    });

    // ── Missing Token ──────────────────────────────────────────────────────────

    test("400 - should fail when refresh token is not provided", async () => {
        const res = await request(app)
            .post("/api/v1/auth/logout")
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Refresh token required");
    });
});
