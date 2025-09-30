const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'H132465',
    database: 'sistema_login'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conexão estabelecida com o MySql')
})

module.exports = db;