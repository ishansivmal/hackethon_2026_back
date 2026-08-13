require('dotenv').config();
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

const db = require('../models');

const EXPECTED_TABLES = [
    'Users',
    'RefreshTokens',
    'EmailVerificationTokens',
    'PasswordResetTokens',
    'internship',
    'problem',
    'job',
    'solution',
    'applied_internship',
    'applied_job',
    'applied_problem'
];

async function run() {
    try {
        await db.sequelize.authenticate();
        process.stdout.write('DB_CONNECTED\n');

        await db.sequelize.sync({ alter: true });
        process.stdout.write('SYNC_DONE\n');

        const [tables] = await db.sequelize.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        process.stdout.write('TABLES_START\n');
        tableNames.forEach(t => process.stdout.write('TABLE:' + t + '\n'));
        process.stdout.write('TABLES_END\n');

        const loadedModels = Object.keys(db).filter(k => !['sequelize', 'Sequelize'].includes(k));
        process.stdout.write('MODELS_START\n');
        loadedModels.forEach(m => process.stdout.write('MODEL:' + m + '\n'));
        process.stdout.write('MODELS_END\n');

        const missing = EXPECTED_TABLES.filter(t => !tableNames.map(x => x.toLowerCase()).includes(t.toLowerCase()));
        if (missing.length > 0) {
            process.stdout.write('MISSING_START\n');
            missing.forEach(t => process.stdout.write('MISSING:' + t + '\n'));
            process.stdout.write('MISSING_END\n');
        } else {
            process.stdout.write('ALL_TABLES_OK\n');
        }

        await db.sequelize.close();
        process.exit(0);
    } catch (err) {
        process.stdout.write('ERROR:' + err.message + '\n');
        process.exit(1);
    }
}

run();
