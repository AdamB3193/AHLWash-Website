/* Local harness for api/quote.js — run: node test_quote_api.js */
const handler = require("./api/quote.js");

function mockRes() {
  const res = { statusCode: 200, headers: {}, body: null };
  res.setHeader = (k, v) => (res.headers[k] = v);
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (o) => ((res.body = o), res);
  return res;
}

async function run(name, method, body, headers = {}, expectStatus, expectOk) {
  const req = { method, body, headers: { "x-forwarded-for": "1.2.3.4", ...headers } };
  const res = mockRes();
  await handler(req, res);
  const pass = res.statusCode === expectStatus && (expectOk === undefined || res.body.ok === expectOk);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ->  ${res.statusCode} ${JSON.stringify(res.body)}`);
  return pass;
}

const valid = {
  "first-name": "Test",
  "last-name": "Customer",
  phone: "(703) 555-0123",
  zip: "22153",
  address: "7113 Hundsford Ln, Springfield, VA",
  service: "First Impressions Bundle ($220–$380)",
  details: "Driveway has some oil stains",
};

(async () => {
  let ok = true;
  ok &= await run("GET rejected", "GET", {}, {}, 405, false);
  ok &= await run("honeypot quietly accepted", "POST", { ...valid, "bot-field": "spam" }, {}, 200, true);
  ok &= await run("missing name", "POST", { ...valid, "first-name": "" }, {}, 400, false);
  ok &= await run("bad phone", "POST", { ...valid, phone: "abc" }, {}, 400, false);
  ok &= await run("bad zip", "POST", { ...valid, zip: "123" }, {}, 400, false);
  ok &= await run("bad service", "POST", { ...valid, service: "hack" }, {}, 400, false);
  ok &= await run("valid but no API key -> 500", "POST", valid, {}, 500, false);

  // rate limit: 5 allowed per window per IP (4 used above on 1.2.3.4? only POSTs count... all non-GET hit the throttle AFTER honeypot)
  const ip = { "x-forwarded-for": "9.9.9.9" };
  for (let i = 0; i < 5; i++) await run(`throttle warmup ${i + 1}`, "POST", { ...valid, zip: "123" }, ip, 400, false);
  ok &= await run("6th request throttled", "POST", valid, ip, 429, false);

  console.log(ok ? "\nALL PASS" : "\nSOME FAILED");
  process.exit(ok ? 0 : 1);
})();
