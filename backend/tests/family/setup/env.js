// Required first by every family test file. Fake values so tests never
// touch the real .env — mirrors tests/caregiver/setup/env.js.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-family-tests-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-family-tests-only';
