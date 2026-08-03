/**
 * API Tests — /api/recommendations & /api/health
 * Run with: npm test (from /backend)
 */

const request = require("supertest");
const express = require("express");
const cors = require("cors");
const { getRentalRecommendations, formatAsText } = require("../engine");

// Spin up the same app without calling .listen()
function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/recommendations", (req, res) => {
    const { branch, semester, semesterStartDate } = req.query;

    if (!branch || typeof branch !== "string" || branch.trim() === "") {
      return res.status(400).json({ error: "Missing required query param: branch (non-empty string)." });
    }

    const semesterInt = parseInt(semester, 10);
    if (
      semester === undefined ||
      semester === null ||
      semester === "" ||
      isNaN(semesterInt) ||
      semesterInt < 1 ||
      semesterInt > 8 ||
      String(semesterInt) !== String(semester).trim()
    ) {
      return res.status(400).json({ error: "Missing or invalid query param: semester (must be an integer between 1 and 8)." });
    }

    if (!semesterStartDate || semesterStartDate.trim() === "") {
      return res.status(400).json({ error: "Missing required query param: semesterStartDate (ISO date string, e.g. 2026-08-10)." });
    }

    const parsedDate = new Date(semesterStartDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: `Invalid semesterStartDate: "${semesterStartDate}" is not a valid ISO date.` });
    }

    const studentProfile = {
      branch: branch.trim(),
      semester: semesterInt,
      semesterStartDate: semesterStartDate.trim(),
    };

    try {
      const recommendations = getRentalRecommendations(studentProfile);
      const text = formatAsText(recommendations, studentProfile);
      return res.json({ recommendations, text });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error." });
    }
  });

  return app;
}

const app = buildApp();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  test("returns status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("GET /api/recommendations — validation", () => {
  test("400 when branch is missing", async () => {
    const res = await request(app).get(
      "/api/recommendations?semester=3&semesterStartDate=2026-08-10"
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/branch/i);
  });

  test("400 when semester is out of range (0)", async () => {
    const res = await request(app).get(
      "/api/recommendations?branch=Computer+Engineering&semester=0&semesterStartDate=2026-08-10"
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/semester/i);
  });

  test("400 when semesterStartDate is not a valid ISO date", async () => {
    const res = await request(app).get(
      "/api/recommendations?branch=Computer+Engineering&semester=3&semesterStartDate=not-a-date"
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/semesterStartDate/i);
  });
});

describe("GET /api/recommendations — happy path", () => {
  test("returns recommendations array and text string for a valid profile", async () => {
    // Computer Engineering Sem 3 — should hit Electronics Lab + Hackathon windows near 2026-09-05
    const res = await request(app).get(
      "/api/recommendations?branch=Computer+Engineering&semester=3&semesterStartDate=2026-08-10"
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(typeof res.body.text).toBe("string");
    expect(res.body.text.length).toBeGreaterThan(0);
  });

  test("returns valid empty-state text for a profile with no active windows", async () => {
    // IT Sem 5 started Jan 2026 — far outside any window by August 2026
    const res = await request(app).get(
      "/api/recommendations?branch=IT&semester=5&semesterStartDate=2026-01-10"
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(typeof res.body.text).toBe("string");
  });
});
