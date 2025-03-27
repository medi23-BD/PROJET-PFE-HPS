// test-db.js
const db = require('./src/config/base-donnee');

db.all('SELECT * FROM transactions', [], (err, rows) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Transactions :', rows);
});
