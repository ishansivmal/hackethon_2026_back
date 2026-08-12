const request = require("supertest");
const app = require("../../app");

jest.mock("../../config/email", () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: "mocked" })
}));

const confirmLatestUser = require("../helpers/confirmUser");

// ─── Admin Routes ──────────────────────────────────────────────────────────────
// GET    /api/v1/admin/users
// PUT    /api/v1/admin/users/:id/role
// DELETE /api/v1/admin/users/:id

describe("Admin - User Management", () => {

    let adminToken;
    let userToken;
    let regularUserId;

    beforeAll(async () => {
        // Register & login as admin (assumes seeded admin account exists)
        // Update credentials below to match your seeded admin
        const adminEmail    = process.env.TEST_ADMIN_EMAIL    || "ishansivmal@gmail.com";
        const adminPassword = process.env.TEST_ADMIN_PASSWORD || "Admin123456!";

        const adminLogin = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: adminEmail, password: adminPassword });

        adminToken = adminLogin.body.accessToken;

        // Register a regular test user
        const userEmail = `regular_${Date.now()}@example.com`;

        const userReg = await request(app)
            .post("/api/v1/auth/register")
            .send({ name: "Regular User", email: userEmail, password: "Password@123" });

        regularUserId = userReg.body.user?.id;

        await confirmLatestUser(app, userEmail);

        const userLogin = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: userEmail, password: "Password@123" });

        userToken = userLogin.body.accessToken;
    });

    // ── GET /api/v1/admin/users ────────────────────────────────────────────────

    describe("GET /api/v1/admin/users", () => {

        test("200 - admin should get all users", async () => {
            const res = await request(app)
                .get("/api/v1/admin/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("users");
            expect(Array.isArray(res.body.users)).toBe(true);
        });

        test("403 - regular user should be denied", async () => {
            const res = await request(app)
                .get("/api/v1/admin/users")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        test("401 - unauthenticated request should be rejected", async () => {
            const res = await request(app)
                .get("/api/v1/admin/users");

            expect(res.statusCode).toBe(401);
        });
    });

    // ── PUT /api/v1/admin/users/:id/role ──────────────────────────────────────

    describe("PUT /api/v1/admin/users/:id/role", () => {

        test("200 - admin should update a user's role", async () => {
            if (!regularUserId) return;

            const res = await request(app)
                .put(`/api/v1/admin/users/${regularUserId}/role`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "admin" });

            expect(res.statusCode).toBe(200);
            expect(res.body.user).toHaveProperty("role", "admin");

            // Restore user role
            await request(app)
                .put(`/api/v1/admin/users/${regularUserId}/role`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "user" });
        });

        test("400 - should fail with an invalid role value", async () => {
            if (!regularUserId) return;

            const res = await request(app)
                .put(`/api/v1/admin/users/${regularUserId}/role`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "superuser" });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty("message", "Invalid role. Allowed roles: user, admin, company, jobseeker");
        });

        test("404 - should fail when user does not exist", async () => {
            const res = await request(app)
                .put("/api/v1/admin/users/99999999/role")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "admin" });

            expect(res.statusCode).toBe(404);
        });

        test("403 - regular user should be denied", async () => {
            const res = await request(app)
                .put(`/api/v1/admin/users/${regularUserId}/role`)
                .set("Authorization", `Bearer ${userToken}`)
                .send({ role: "admin" });

            expect(res.statusCode).toBe(403);
        });
    });

    // ── DELETE /api/v1/admin/users/:id ────────────────────────────────────────

    describe("DELETE /api/v1/admin/users/:id", () => {

        test("404 - should fail when user does not exist", async () => {
            const res = await request(app)
                .delete("/api/v1/admin/users/99999999")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
        });

        test("403 - regular user should be denied", async () => {
            const res = await request(app)
                .delete(`/api/v1/admin/users/${regularUserId}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        test("200 - admin should delete a user", async () => {
            if (!regularUserId) return;

            const res = await request(app)
                .delete(`/api/v1/admin/users/${regularUserId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("message", "User deleted");
        });
    });
});
