const request = require("supertest");
const app = require("../../app");

// ─── POST /api/v1/auth/forgot-password
// ─── POST /api/v1/auth/reset-password ────────────────────────────────────────

describe("Auth - Forgot Password", () => {

    // ── Valid Email (account exists) ───────────────────────────────────────────

    test("200 - should respond with reset link message for existing email", async () => {
        const email = `fp_test_${Date.now()}@example.com`;

        await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "FP Tester", email, password: "Password@123" });

        const res = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/password reset link/i);
    });

    // ── Non-existent Email (still 200 to avoid leaking info) ─────────────────

    test("200 - should respond the same way for a non-existent email", async () => {
        const res = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: "nobody@nowhere.com" });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/password reset link/i);
    });

    // ── Invalid Email Format ───────────────────────────────────────────────────

    test("400 - should fail with invalid email format", async () => {
        const res = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: "not-an-email" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Please provide a valid email address");
    });

    // ── Missing Email ──────────────────────────────────────────────────────────

    test("400 - should fail when email is not provided", async () => {
        const res = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({});

        expect(res.statusCode).toBe(400);
    });
});

describe("Auth - Reset Password", () => {

    // ── Missing Token ──────────────────────────────────────────────────────────

    test("400 - should fail when reset token is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ newPassword: "NewPassword@456" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Reset token is required");
    });

    // ── Missing New Password ───────────────────────────────────────────────────

    test("400 - should fail when new password is missing", async () => {
        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: "sometoken" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "New password is required");
    });

    // ── Weak New Password ──────────────────────────────────────────────────────

    test("400 - should fail with a weak new password", async () => {
        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: "sometoken", newPassword: "1234" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Password must be at least 8 characters/);
    });

    // ── Invalid / Expired Token ────────────────────────────────────────────────

    test("400 - should fail with an invalid or expired reset token", async () => {
        const res = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({ token: "invalidtoken123", newPassword: "NewPassword@456" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Invalid or expired reset token");
    });
});
