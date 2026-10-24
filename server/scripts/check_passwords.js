const db = require('../config/database');
const bcrypt = require('bcryptjs');

const users = db.prepare('SELECT id, identifier, email, role, password_hash FROM users').all();
const testPasswords = [
  'Student@123',
  'student@123',
  'student123',
  'Student123',
  'Admin@123',
  'Teacher@123',
  '123456',
  'password',
  'Govind@123',
  'Govind123'
];

console.log('Testing passwords against users:');
for (const u of users) {
  let matched = [];
  for (const p of testPasswords) {
    if (bcrypt.compareSync(p, u.password_hash)) {
      matched.push(p);
    }
  }
  console.log(`ID ${u.id}: ${u.identifier} (${u.role}) -> Matched: [${matched.join(', ')}]`);
}
