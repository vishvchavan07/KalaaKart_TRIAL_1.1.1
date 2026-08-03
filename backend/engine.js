/**
 * Smart Rentals Prediction — Pure Rule-Based Engine (KalaaKart Phase 2, AI Layer I)
 *
 * No ML model, no LLM API calls. Deterministic if-else logic over a rules
 * dataset. Zero token cost, zero external calls, fully predictable output —
 * built to be dropped straight into an Express route later.
 *
 * Input:  student profile + today's date
 * Output: plain-text recommendation objects (no images, no markup)
 */

const fs = require("fs");
const path = require("path");

const RULES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "rules-data.json"), "utf-8")
);

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function daysBetween(a, b) {
  return Math.floor((b - a) / MS_PER_DAY);
}

/**
 * Lab-based recommendations: does the student's branch/semester have a lab
 * whose typical trigger window (in weeks-since-semester-start) includes "today"?
 */
function getLabRecommendations({ branch, semester, semesterStartDate }, today) {
  const start = new Date(semesterStartDate);
  const currentWeek = Math.floor((today - start) / MS_PER_WEEK) + 1;
  if (currentWeek < 1) return [];

  return RULES.labs
    .filter(
      (lab) =>
        lab.branch.includes(branch) &&
        lab.semester.includes(semester) &&
        currentWeek >= lab.triggerWeekStart &&
        currentWeek <= lab.triggerWeekEnd
    )
    .map((lab) => ({
      type: "lab",
      title: lab.subject,
      items: lab.items,
      message: `Heading into ${lab.subject} this semester — students usually need: ${lab.items.join(", ")}.`,
    }));
}

/**
 * Exam-window recommendations: is today within leadDays before an exam window
 * (through the end of the window)?
 */
function getExamRecommendations(today) {
  return RULES.examWindows
    .filter((exam) => {
      const start = new Date(exam.start);
      const end = new Date(exam.end);
      const leadStart = new Date(start.getTime() - exam.leadDays * MS_PER_DAY);
      return today >= leadStart && today <= end;
    })
    .map((exam) => ({
      type: "exam",
      title: exam.name,
      items: exam.items,
      message: `${exam.name} are coming up — consider renting: ${exam.items.join(", ")}.`,
    }));
}

/**
 * Hackathon-season recommendations: same lead-window logic as exams.
 */
function getHackathonRecommendations(today) {
  return RULES.hackathonSeasons
    .filter((season) => {
      const start = new Date(season.start);
      const end = new Date(season.end);
      const leadStart = new Date(start.getTime() - season.leadDays * MS_PER_DAY);
      return today >= leadStart && today <= end;
    })
    .map((season) => ({
      type: "hackathon",
      title: season.name,
      items: season.items,
      message: `${season.name} is active — teams are usually renting: ${season.items.join(", ")}.`,
    }));
}

/**
 * Combine all rule sources into one recommendation list for a student.
 * @param {{branch: string, semester: number, semesterStartDate: string}} studentProfile
 * @param {Date} [today] - defaults to now; pass a fixed date for testing/demo
 */
function getRentalRecommendations(studentProfile, today = new Date()) {
  const recs = [
    ...getLabRecommendations(studentProfile, today),
    ...getExamRecommendations(today),
    ...getHackathonRecommendations(today),
  ];
  return recs;
}

/**
 * Render recommendations as a single plain-text block — no HTML, no markdown,
 * no images. Safe to return directly from an API as `text/plain` or wrap in JSON.
 */
function formatAsText(recommendations, studentProfile) {
  if (recommendations.length === 0) {
    return `No rental recommendations for ${studentProfile.branch}, Semester ${studentProfile.semester} right now. Check back closer to labs or exams.`;
  }
  const lines = recommendations.map((r, i) => `${i + 1}. [${r.type.toUpperCase()}] ${r.message}`);
  return [`Rental recommendations for ${studentProfile.branch}, Semester ${studentProfile.semester}:`, "", ...lines].join("\n");
}

module.exports = { getRentalRecommendations, formatAsText };
