const request = require("supertest");
const app = require("../../app");

jest.mock("../../config/email", () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: "mocked" })
}));

const confirmLatestUser = require("../helpers/confirmUser");

// ─── GET /api/v1/auth/profile ─────────────────────────────────────────────────

describe("Auth - Profile (Protected Route)", () => {

    let accessToken;

    beforeAll(async () => {
        const email = `profile_test_${Date.now()}@example.com`;

        await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "Profile Tester", email, password: "Password@123" });

        await confirmLatestUser(app, email);

        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: "Password@123" });

        accessToken = loginRes.body.accessToken;
    });

    // ── Authenticated ──────────────────────────────────────────────────────────

    test("200 - should return user profile when token is valid", async () => {
        const res = await request(app)
            .get("/api/v1/auth/profile")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "You are authenticated!");
        expect(res.body).toHaveProperty("user");
    });

    // ── Unauthenticated ────────────────────────────────────────────────────────

    test("401 - should return 401 when no token is provided", async () => {
        const res = await request(app)
            .get("/api/v1/auth/profile");

        expect(res.statusCode).toBe(401);
    });

    test("401 - should return 401 with a fake/invalid token", async () => {
        const res = await request(app)
            .get("/api/v1/auth/profile")
            .set("Authorization", "Bearer this.is.fake.token");

        expect(res.statusCode).toBe(401);
    });
});
