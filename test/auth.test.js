const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, comparePassword, signToken, verifyToken } = require('../src/utils/auth');

test('hashPassword creates a bcrypt hash and comparePassword verifies it', async () => {
  const password = 'SuperSecret123!';
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(await comparePassword(password, hash), true);
  assert.equal(await comparePassword('wrong-password', hash), false);
});

test('signToken and verifyToken work for JWT payloads', () => {
  const token = signToken({ id: 7, role: 'mahasiswa' });
  const decoded = verifyToken(token);

  assert.equal(decoded.id, 7);
  assert.equal(decoded.role, 'mahasiswa');
});
