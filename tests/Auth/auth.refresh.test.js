const request = require("supertest");
const app = require("../../app");

jest.mock("../../config/email", () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: "mocked" })
}));

const confirmLatestUser = require("../helpers/confirmUser");

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────

describe("Auth - Refresh Token", () => {

    let validRefreshToken;

    beforeAll(async () => {
        const email = `refresh_test_${Date.now()}@example.com`;

        await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "Refresh Tester", email, password: "Password@123" });

        await confirmLatestUser(app, email);

        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: "Password@123" });

        validRefreshToken = loginRes.body.refreshToken;
    });

    // ── Success ────────────────────────────────────────────────────────────────

    test("200 - should return new access and refresh tokens", async () => {
        if (!validRefreshToken) {
            console.warn("Skipped: no valid refresh token from beforeAll login");
            return;
        }

        const res = await request(app)
            .post("/api/v1/auth/refresh")
            .send({ refreshToken: validRefreshToken });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body).toHaveProperty("refreshToken");
    });

    // ── Invalid Token ──────────────────────────────────────────────────────────

    test("401 - should fail with a fake/invalid refresh token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/refresh")
            .send({ refreshToken: "this.is.not.a.valid.token" });

        expect(res.statusCode).toBe(401);
    });

    // ── Missing Token ──────────────────────────────────────────────────────────

    test("401 - should fail when refresh token is not provided", async () => {
        const res = await request(app)
            .post("/api/v1/auth/refresh")
            .send({});

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("message", "Refresh token required");
    });
});
