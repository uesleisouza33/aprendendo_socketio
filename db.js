const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'senai',
    database: 'sistema_chat',
    port: 3306
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conexão estabelecida com o MySql')
})

module.exports = db;