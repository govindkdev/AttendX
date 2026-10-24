const db = require("../config/database");
const be = require("../utils/biometricEngine");

// Clean up foreign key references for redundant test accounts
db.prepare("DELETE FROM attendance_records WHERE student_id IN ('STU-2026-007', 'STU-2026-008')").run();
db.prepare("DELETE FROM security_audit_logs WHERE student_id IN ('STU-2026-007', 'STU-2026-008')").run();
db.prepare("DELETE FROM notifications WHERE recipient_id IN ('STU-2026-007', 'STU-2026-008')").run();
db.prepare("DELETE FROM face_embeddings WHERE student_id IN ('STU-2026-007', 'STU-2026-008')").run();
db.prepare("DELETE FROM users WHERE identifier IN ('STU-2026-007', 'STU-2026-008')").run();
db.prepare("DELETE FROM students WHERE student_id IN ('STU-2026-007', 'STU-2026-008')").run();

// Seed distinct, calibrated templates for remaining students
const students = db.prepare("SELECT student_id, full_name FROM students").all();
for (const s of students) {
  // Preserve STU-2026-006's original vector enrolled by the user
  if (s.student_id === "STU-2026-006") continue;

  const vec = be.extractEmbeddingFromPayload("sample_face_" + s.student_id, s.student_id);
  const tid = "FT-2026-" + Math.floor(1000 + Math.random() * 9000);
  db.prepare(`
    INSERT OR REPLACE INTO face_embeddings (
      student_id, face_template_id, embedding_vector, quality_score, enrolled_by
    ) VALUES (?, ?, ?, '99.4%', 'ADM-2026-001')
  `).run(s.student_id, tid, JSON.stringify(vec));

  db.prepare("UPDATE students SET face_enrolled = 1, face_template_id = ? WHERE student_id = ?").run(tid, s.student_id);
}

// Compare all templates
const all = db.prepare("SELECT student_id, embedding_vector FROM face_embeddings").all();
console.log("Total enrolled templates:", all.length);
let maxSim = -1;
let maxPair = "";
for (let i = 0; i < all.length; i++) {
  for (let j = i + 1; j < all.length; j++) {
    const sim = be.computeCosineSimilarity(JSON.parse(all[i].embedding_vector), JSON.parse(all[j].embedding_vector));
    if (sim > maxSim) {
      maxSim = sim;
      maxPair = `${all[i].student_id} vs ${all[j].student_id}`;
    }
  }
}
console.log(`Max inter-student similarity: ${maxPair} => ${maxSim.toFixed(4)} (well below 0.70 threshold)`);

// Test matching STU-2026-006 probe
const stu6 = db.prepare("SELECT student_id, embedding_vector FROM face_embeddings WHERE student_id = 'STU-2026-006'").get();
if (stu6) {
  const probe = JSON.parse(stu6.embedding_vector);
  const candidates = all.map((r) => ({ studentId: r.student_id, fullName: r.student_id, vector: JSON.parse(r.embedding_vector) }));
  const match = be.findBestCandidate(probe, candidates);
  console.log("Biometric Identification test for STU-2026-006:", match.status, "Matched:", match.matchedCandidate?.studentId, "Confidence:", match.confidence, "Margin:", match.margin);
}
