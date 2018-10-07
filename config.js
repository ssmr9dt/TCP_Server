
module.exports.mysql_host = "localhost";
module.exports.mysql_user = "root";
module.exports.mysql_pass = "";
module.exports.mysql_db   = "user";

// 
module.exports.ports      = [2000,2001];

module.exports.separator  = "<>";
module.exports.endpoint   = "<>@@@";

module.exports.server_command_path	= "./server.d/";
module.exports.server_log			= "./Log/";
module.exports.server_access_log	= module.exports.server_log+"access.log";
module.exports.server_error_log		= module.exports.server_log+"error.log";

module.exports.logintime_out = 6; //sec
