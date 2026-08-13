const request = require("supertest");
const app = require("../../app");

jest.mock("../../config/email", () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: "mocked" })
}));

const confirmLatestUser = require("../helpers/confirmUser");

// ─── POST /api/v1/auth/confirm-email ──────────────────────────────────────────

describe("Auth - Confirm Email", () => {

    // ── Success ────────────────────────────────────────────────────────────────

    test("200 - should confirm a registered user's email", async () => {
        const email = `confirm_ok_${Date.now()}@example.com`;

        await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "Confirm Tester", email, password: "Password@123" });

        // Login is blocked until the email is confirmed
        const blockedRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: "Password@123" });

        expect(blockedRes.statusCode).toBe(403);

        const confirmRes = await confirmLatestUser(app, email);

        expect(confirmRes.statusCode).toBe(200);
        expect(confirmRes.body).toHaveProperty(
            "message",
            "Email confirmed successfully. You can now log in."
        );
        expect(confirmRes.body.user).toHaveProperty("emailVerified", true);

        // Now login succeeds
        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password: "Password@123" });

        expect(loginRes.statusCode).toBe(200);
    });

    // ── Validation Failures ────────────────────────────────────────────────────

    test("400 - should fail when token is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/confirm-email")
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Verification token is required");
    });

    test("400 - should fail with an invalid token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/confirm-email")
            .send({ token: "invalidtoken123" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Invalid or expired verification token");
    });
});
