require('dotenv').config();
const sequelize = require('./config/database');

const run = async () => {
  for (const table of ['internship', 'job', 'problem']) {
    const [rows] = await sequelize.query(`SHOW CREATE TABLE ${table}`);
    const ddl = rows[0] && rows[0]['Create Table'] ? rows[0]['Create Table'] : '';
    const fks = ddl.split('\n').filter((l) => /CONSTRAINT.*FOREIGN KEY/.test(l)).map((l) => l.trim());
    console.log(`\n${table}: ${fks.length} FK constraints`);
    fks.forEach((f) => console.log('  ' + f));
  }
  await sequelize.close();
};

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
