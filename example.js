const { getRentalRecommendations, formatAsText } = require("./engine");

// Pin "today" for a repeatable demo. In production this is just `new Date()`.
const DEMO_TODAY = new Date("2026-09-05");

const students = [
  {
    label: "Comp Engg, Sem 3 — mid-semester + early Electronics Lab window",
    profile: { branch: "Computer Engineering", semester: 3, semesterStartDate: "2026-08-10" },
  },
  {
    label: "Mechanical, Sem 6 — Robotics Lab window",
    profile: { branch: "Mechanical Engineering", semester: 6, semesterStartDate: "2026-07-20" },
  },
  {
    label: "IT, Sem 5 — outside any active window",
    profile: { branch: "IT", semester: 5, semesterStartDate: "2026-01-10" },
  },
];

students.forEach(({ label, profile }) => {
  console.log("=".repeat(70));
  console.log(label);
  console.log("=".repeat(70));
  const recs = getRentalRecommendations(profile, DEMO_TODAY);
  console.log(formatAsText(recs, profile));
  console.log();
});
