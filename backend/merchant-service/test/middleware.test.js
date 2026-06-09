const test = require('node:test');
const assert = require('node:assert/strict');

const authMiddleware = require('../src/middleware/authMiddleware');

test('authMiddleware bypasses when no token is provided (dev mode)', () => {
  const req = { headers: {} };
  const res = {};
  let nextCalled = false;
  
  const next = () => { nextCalled = true; };

  authMiddleware(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(req.user, undefined);
});

test('authMiddleware sets req.user when Bearer token is provided', () => {
  const req = { headers: { authorization: 'Bearer dummy-token' } };
  const res = {};
  let nextCalled = false;
  
  const next = () => { nextCalled = true; };

  authMiddleware(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'mock-user-id-from-token');
  assert.equal(req.user.role, 'merchant');
});
