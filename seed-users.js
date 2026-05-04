/**
 * seed-users.js — Register 5 demo users via the blog API
 *
 * Usage:
 *   node seed-users.js
 *
 * Requirements:
 *   - Spring Boot server running on http://localhost:8080
 *   - No extra npm packages needed (uses built-in fetch, Node 18+)
 *     OR with Node < 18: run `npm install node-fetch` and uncomment the import below
 */

// const fetch = require("node-fetch"); // ← Uncomment for Node < 18

const BASE_URL = "http://localhost:8080/api";

const USERS = [
  { username: "alice_writes",  email: "alice@example.com",  password: "Alice@123"  },
  { username: "bob_dev",       email: "bob@example.com",    password: "Bob@12345"  },
  { username: "carol_tech",    email: "carol@example.com",  password: "Carol@123"  },
  { username: "david_blog",    email: "david@example.com",  password: "David@123"  },
  { username: "eve_stories",   email: "eve@example.com",    password: "Eve@12345"  },
];

async function registerUser(user) {
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    const text = await res.text();

    if (res.ok) {
      console.log(`✅  Registered: ${user.username} <${user.email}>`);
      console.log(`    → ${text}`);
    } else {
      console.warn(`⚠️   Skipped ${user.username}: ${text}`);
    }
  } catch (err) {
    console.error(`❌  Error registering ${user.username}:`, err.message);
  }
}

(async () => {
  console.log("🌱  Seeding users...\n");
  for (const user of USERS) {
    await registerUser(user);
  }
  console.log("\n✅  Done! Check your email server to verify accounts if needed.");
  console.log("    (Dev tip: disable email verification in application.yml for local seeding)");
})();
