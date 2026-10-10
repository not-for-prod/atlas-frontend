// Deterministic test process only. Never imported by application code.
import { createServer } from 'node:http';
let scenario = 'email';
let serial = 0;
let clientCalls = 0;
const transactions = new Map();
const expiresAt = () => new Date(Date.now() + 300000).toISOString();
const email = { requirementId: 'primary', methodId: 'email_code', providerId: '' };
const google = { requirementId: 'primary', methodId: 'oauth', providerId: 'google' };
function methods() {
  return scenario.startsWith('oauth') ? [google] : scenario === 'empty' ? [] : [email];
}
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:3112');
  if (req.headers.origin === process.env.ATLAS_TEST_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Atlas-Session');
    res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }
  }
  function send(data, status = 200, headers = {}) {
    if ((data?.result?.session || data?.token) && req.headers['x-atlas-session'] === 'cookie') {
      res.setHeader('Set-Cookie', 'atlas_session=test-issued-bearer; Path=/; HttpOnly; SameSite=Lax');
      if (data.result?.session) delete data.result.session.token;
      if (data.token) {
        delete data.token;
        data.authenticated = true;
      }
    }
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify(data));
  }
  if (url.pathname === '/__test/reset') {
    scenario = url.searchParams.get('scenario') || 'email';
    transactions.clear();
    clientCalls = 0;
    return send({ ok: true });
  }
  if (url.pathname === '/health') return send({ ok: true });
  if (req.headers.origin !== process.env.ATLAS_TEST_ORIGIN) return send({ error: 'origin' }, 403);
  if (url.pathname === '/v1/cards/tariff')
    return send({
      tariffId: 'test-card-plan',
      currency: 'USD',
      categories: Object.fromEntries(
        [
          ['CATEGORY_SUBSCRIPTIONS', 'Для подписок и онлайн-сервисов'],
          ['CATEGORY_TRAVEL', 'Для путешествий и бронирования'],
          ['CATEGORY_PREMIUM', 'Для ежедневных покупок'],
        ].map(([id, description]) => [
          id,
          {
            description,
            requiresKyc: false,
            topup: { minimalAmount: '10', maximumAmount: '1000' },
            fees: {
              issue: { fixed: '20' },
              deposit: { minimal: '0', fixed: '0.03', percent: '1.5' },
            },
          },
        ]),
      ),
    });
  if (url.pathname === '/auth/caller') {
    res.writeHead(204, { 'Set-Cookie': 'atlas_auth_caller=test-caller; Path=/; HttpOnly; SameSite=Lax' });
    return res.end();
  }
  if (!req.headers.cookie?.includes('atlas_auth_caller=test-caller'))
    return send({ error: 'association' }, 403);
  if (url.pathname === '/auth/logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', 'atlas_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    res.writeHead(204);
    return res.end();
  }
  if (url.pathname === '/client') {
    if (!req.headers.cookie?.includes('atlas_session=test-issued-bearer')) return send({}, 401);
    if (scenario === 'revoked') return send({}, 401);
    if (scenario === 'initializing' && clientCalls++ < 2) {
      res.writeHead(503, { 'Retry-After': '1' });
      return res.end('client initialization pending');
    }
    return send({ client_id: 'test-client', currency: 'USD', available_amount: 0, reserved_amount: 0 });
  }
  if (url.pathname === '/v1/tenants/atlas/auth/policy') {
    if (scenario === 'unavailable') return send({}, 503);
    const requirements = {
      id: 'primary',
      any: methods().map((m) => ({ method: m.methodId, provider: m.providerId })),
    };
    return send({
      intents: (scenario === 'signup'
        ? ['INTENT_SIGN_UP']
        : ['INTENT_SIGN_IN', 'INTENT_SIGN_UP', 'INTENT_DELETE']
      ).map((intent) => ({ intent, requirements })),
    });
  }
  let body = {};
  if (req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    body = JSON.parse(raw || '{}');
  }
  if (url.pathname.endsWith('/transactions') && req.method === 'POST') {
    const id = `tx-${++serial}`;
    const transaction = {
      id,
      intent: body.intent,
      expiresAt: expiresAt(),
      status: 'active',
      availableMethods: methods(),
    };
    transactions.set(id, transaction);
    return send({ transaction });
  }
  const matched = url.pathname.match(/\/transactions\/(tx-\d+)(.*)/);
  if (matched) {
    const tx = transactions.get(matched[1]);
    if (!tx) return send({}, 404);
    if (!matched[2]) return send({ transaction: tx });
    if (matched[2] === ':startMethod') {
      if (scenario === 'rate') return send({}, 429, { 'Retry-After': '60' });
      tx.pendingAttempt = {
        attemptId: 'attempt',
        challengeId: 'challenge',
        ready: true,
        selection: body.selection,
      };
      return send({
        transaction: tx,
        attemptId: 'attempt',
        challenge: { id: 'challenge', expiresAt: expiresAt() },
        ...(body.selection.methodId === 'oauth'
          ? { redirectUrl: 'https://accounts.google.com/test-consent?state=test-state' }
          : {}),
      });
    }
    if (matched[2] === ':verifyMethod') {
      if (body.input.code !== '123456') return send({ message: 'invalid proof' }, 401);
      if (scenario === 'partial') {
        delete tx.pendingAttempt;
        tx.availableMethods = [{ ...email, requirementId: 'second' }];
        return send({ transaction: tx });
      }
      tx.status = 'completed';
      delete tx.pendingAttempt;
      if (tx.intent === 'INTENT_DELETE') {
        res.setHeader('Set-Cookie', 'atlas_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
        return send({ transaction: tx, result: { principal: { userId: 'deleted-user' } } });
      }
      return send({
        transaction: tx,
        result: { session: { token: 'test-issued-bearer', expiresAt: expiresAt() } },
      });
    }
  }
  if (
    url.pathname === '/auth/callback/google' &&
    scenario === 'oauth-unregistered' &&
    ![...transactions.values()].some((tx) => tx.intent === 'INTENT_SIGN_UP')
  )
    return send({ error: 'account_not_found' }, 404);
  if (url.pathname === '/auth/callback/google')
    return send({ status: 'completed', token: 'test-issued-bearer', expires_at: expiresAt() });
  send({}, 404);
}).listen(3112, '127.0.0.1');
