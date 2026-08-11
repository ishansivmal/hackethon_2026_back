// ─── Auth Test Suite ──────────────────────────────────────────────────────────
// Run this file to execute ALL auth-related tests at once.
// Usage: npx jest tests/Auth/auth.test.js --detectOpenHandles --forceExit

require("./auth.register.test");
require("./auth.login.test");
require("./auth.refresh.test");
require("./auth.logout.test");
require("./auth.password.test");
require("./auth.profile.test");
