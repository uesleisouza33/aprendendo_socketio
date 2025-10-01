const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'yamabiko.proxy.rlwy.net',
    user: 'root',
    password: 'VTkytnSuFpaYYkWWXQrFBDzfkMDsWIKJ',
    database: 'sistema_chat',
    port: 47024
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conexão estabelecida com o MySql')
})

module.exports = db;