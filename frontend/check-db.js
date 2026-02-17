// check-db.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../cpg.db');
const db = new Database(dbPath, { readonly: true });

console.log('=== СТРУКТУРА ТАБЛИЦЫ NODES ===');
const nodesColumns = db.prepare("PRAGMA table_info(nodes)").all();
console.table(nodesColumns);

console.log('\n=== СТРУКТУРА ТАБЛИЦЫ SOURCES ===');
const sourcesColumns = db.prepare("PRAGMA table_info(sources)").all();
console.table(sourcesColumns);

console.log('\n=== ПРИМЕР ДАННЫХ ИЗ NODES ===');
const sampleNodes = db.prepare("SELECT * FROM nodes LIMIT 3").all();
console.log(sampleNodes);

console.log('\n=== ПРИМЕР ДАННЫХ ИЗ SOURCES ===');
const sampleSources = db.prepare("SELECT * FROM sources LIMIT 3").all();
console.log(sampleSources);

db.close();