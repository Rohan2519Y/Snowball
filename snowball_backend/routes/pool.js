const mysql = require('mysql')

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'snowball',
    multipleStatements: true,
    connectionLimit: 100
})

module.exports = pool