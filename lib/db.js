const mysql = require('mysql');

const getPool = function () {
  return mysql.createPool({
    //host: parameters.host,
    socketPath: parameters.socketPath,
    user: parameters.db_user,
    password: parameters.db_password,
    database: parameters.db_name,
    connectionLimit: 1000,
    acquireTimeout: 30000,
    trace: true
  });
};

module.exports = {
  getPool: getPool
};
