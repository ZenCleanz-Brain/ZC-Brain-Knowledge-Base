#!/usr/bin/env node
/**
 * Password Hash Generator for Team KB Portal
 *
 * Usage: node scripts/hash-password.js <password>
 *
 * Example:
 *   node scripts/hash-password.js MySecurePass123
 *
 * Then use the output in your .env file:
 *   USERS=admin:$2b$10$xxxxx:admin,editor:$2b$10$yyyyy:editor
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/hash-password.js <password>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/hash-password.js MySecurePass123');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n=== Password Hash Generated ===\n');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\n=== Example USERS env variable ===\n');
console.log(`USERS=admin:${hash}:admin`);
console.log('\n=== Multiple users example ===\n');
console.log(`USERS=admin:${hash}:admin,editor1:${hash}:editor,viewer1:${hash}:viewer`);
console.log('');
