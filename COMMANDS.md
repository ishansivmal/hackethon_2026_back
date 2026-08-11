# Commands

## Node

```bash
npm install
npm install package-name
npm uninstall package-name

node server.js
npx nodemon server.js
```

## Sequelize Migrations

```bash
# Create migration
npx sequelize-cli migration:generate --name migration-name

# Run migration
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## Sequelize Seeders

```bash
# Create seeder
npx sequelize-cli seed:generate --name seed-name

# Run all seeders
npx sequelize-cli db:seed:all

# Undo last seeder
npx sequelize-cli db:seed:undo

# Undo all seeders
npx sequelize-cli db:seed:undo:all
```

## Git

```bash
git status
git add .
git commit -m "message"
git push
git pull
```

## Our Custom Seed

```bash
node seeders/seedUsers.js
```
npm run test:auth   →  58 passed, 58 total ✅
npm run test:admin  →  10 passed, 10 total ✅
npm test            →  All 68 tests pass ✅




SET SQL_SAFE_UPDATES = 0;

DELETE FROM RefreshTokens 
WHERE userId IN (SELECT id FROM Users WHERE role = 'user');

DELETE FROM PasswordResetTokens 
WHERE userId IN (SELECT id FROM Users WHERE role = 'user');

DELETE FROM Users WHERE role = 'user';

SET SQL_SAFE_UPDATES = 1;