require('dotenv').config();
const sequelize = require('./config/database');

// Drops every duplicate ibfk_* foreign key on internship/job/problem and
// replaces them with a single, properly-named constraint each. Also extends
// the job.jobType enum to match the frontend UI (REMOTE/PHYSICAL/HYBRID).

const TABLES = [
  { table: 'internship', prefix: 'internship_ibfk_', fk: 'fk_internship_user', deleteRule: 'ON DELETE CASCADE' },
  { table: 'job', prefix: 'job_ibfk_', fk: 'fk_job_user', deleteRule: 'ON DELETE CASCADE' },
  { table: 'problem', prefix: 'problem_ibfk_', fk: 'fk_problem_user', deleteRule: 'ON DELETE CASCADE' },
];

const run = async () => {
  for (const { table, prefix, fk, deleteRule } of TABLES) {
    const [rows] = await sequelize.query(`SHOW CREATE TABLE ${table}`);
    const ddl = rows[0]['Create Table'];

    const fkNames = [...ddl.matchAll(/CONSTRAINT `([^`]+)` FOREIGN KEY/g)].map((m) => m[1]);

    for (const name of fkNames) {
      console.log(`DROP FOREIGN KEY ${table}.${name}`);
      await sequelize.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${name}\``);
    }

    if (fkNames.length > 0) {
      console.log(`ADD FOREIGN KEY ${table}.${fk}`);
      await sequelize.query(
        `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fk}\` FOREIGN KEY (\`user_ID\`) REFERENCES \`users\` (\`id\`) ${deleteRule} ON UPDATE CASCADE`
      );
    }
  }

  console.log('EXTEND job.jobType enum');
  await sequelize.query(
    "ALTER TABLE `job` MODIFY COLUMN `jobType` ENUM('full-time','part-time','contract','internship','remote','physical','hybrid') NOT NULL"
  );

  await sequelize.close();
  console.log('DONE');
};

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
