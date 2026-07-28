const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/privacy",
  "/terms",
];

for (const route of publicRoutes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }
}

const loginHtml = await (await fetch(`${baseUrl}/login`)).text();
const forbiddenCopy = ["4 goals ready", "First platform", "Local Trainer Network"];

for (const text of forbiddenCopy) {
  if (loginHtml.includes(text)) {
    throw new Error(`Login still contains mock content: ${text}`);
  }
}

const protectedRequests = [
  fetch(`${baseUrl}/api/ai-buddy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "student", goal: "hello" }),
  }),
  fetch(`${baseUrl}/api/billing/subscribe`, { method: "POST" }),
  fetch(`${baseUrl}/api/account/export`),
];

for (const response of await Promise.all(protectedRequests)) {
  if (response.status !== 401) {
    throw new Error(`Protected API returned ${response.status} instead of 401`);
  }
}

console.log(`Smoke test passed for ${baseUrl}`);
