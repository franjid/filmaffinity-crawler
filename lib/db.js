var mysql = require('mysql');

var getPool = function() {
    return mysql.createPool({
        host: parameters.host,
        user: parameters.db_user,
        password: parameters.db_password,
        database: parameters.db_name,
        connectionLimit : 100
    });
};

module.exports = {
    getPool : getPool
};
