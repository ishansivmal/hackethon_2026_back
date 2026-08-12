const request = require("supertest");

// Confirms a freshly-registered user's email by extracting the raw
// verification token from the (mocked) confirmation email HTML and calling
// POST /api/v1/auth/confirm-email.
//
// IMPORTANT: only works when the test file has mocked ../../config/email so
// that sendEmail captures the rendered email instead of actually sending it.
const confirmLatestUser = async (app, email) => {
    const { sendEmail } = require("../../config/email");

    const call = (sendEmail.mock?.calls || []).find(
        (opts) => opts[0].to === email
    );

    const html = call?.[0]?.html || "";

    const match = html.match(/token=([a-f0-9]{64})/);

    if (!match) {
        throw new Error(`No confirmation token found for ${email}`);
    }

    return request(app)
        .post("/api/v1/auth/confirm-email")
        .send({ token: match[1] });
};

module.exports = confirmLatestUser;
