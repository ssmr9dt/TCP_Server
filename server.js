
var cluster = require("cluster");

if (cluster.isMaster) {
	require("os").cpus().forEach(function(elem,i){
		var worker = cluster.fork();
		console.log("worker forked: pid=" + worker.process.pid);
		worker.on("message", function(msg){
			console.log(msg);
			process.exit(0);
			// worker.kill(0);
		});
	});
	
	cluster.on("message", function(){
		
	});

	cluster.on("exit", function(code, signal){
		console.log("worker", code, signal, "died");
	});
	
	const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];
	signals.forEach(function(elem,i) {
		process.on(elem, function() {
			for (const id in cluster.workers) {
				const worker = cluster.workers[id];
				worker.kill(0);
			}
			process.exit(0);
		});
	});
	
} else {
	
}


var qtil = require("./lib/qtil.class.js");
var options = require("./config.js");

var g_commands = {};

function output(str){
	if (cluster.isMaster){
		console.log(str);
	}
}

(function(){
	const hotreload = require("@ssmr9dt/hotreload");
	const hotdeploy = require("@ssmr9dt/hotdeploy");
	const reload_time = 5 * 1000;
	const domain = require("domain").create();
	
	domain.on("error", function(e){
		
	});

	domain.run(function(){
		hotdeploy(options.server_command_path, domain.bind(function(key, module){
			if (!!!module) {
				throw new Error("module is not define: "+key);
			}
			if (typeof module.command !== "function") {
				throw new Error("function command is not define: "+key);
			}
			if (typeof module.naming !== "function") {
				throw new Error("function naming is not define: "+key);
			}
			output((!!!g_commands[key]?"ADD NEW":"UPDATED")+" COMMAND: "+key);
			g_commands[key] = module.command;
		}));
	});

	(function _HOTDEPLOY(){
		setTimeout(_HOTDEPLOY,reload_time);
		
		hotreload("./lib/qtil.class.js", function(err, e){
			if (!!err) { console.log(err); return; }
			output("Updated qtil.class.js");
			qtil = e;
		});

		hotreload("./config.js", function(err, e){
			if (!!err) { console.log(err); return; }
			output("Updated config.js");
			options = e;
		});

	})();
})();

var s = function(c){
	qtil.log("server connected",c);

	// var sql = new MySQLWrap(options,c);
	var sql = null;

	c.sql = sql;
	
	c.cluster = cluster;

	//sql.redis = redis || null;

	c.on("end", function(){
		qtil.log("server disconnected",c);
		//if (options.ports[0] == c.server.address().port) {
		//	//timeout.personal(c.NPID);
		//}
		// sql.end();
	});

	// (function(){
	// 	var count = 0;
	// 	c.NPID = "";
	// 	sql.SelectUser(function _L(d){
	// 		if (!!d.NPID) {
	// 			c.NPID = d.NPID;
	// 			qtil.log(": "+(c.remoteAddress || c._peername.address),c);
	// 		}else{
	// 			if (count++ >= 1000) {
	// 				c.NPID = c.remoteAddress || c._peername.address;
	// 				return;
	// 			}
	// 			setTimeout(function(){
	// 				sql.SelectUser(_L);
	// 			},10);
	// 		}
	// 	});
	// })();

	var buffer = "";

	var commands = [];

	var NextLoop = function(cb){  };
	//NextLoop(
	function _COMMAND(){
		if (commands.length === 0) {
			NextLoop(_COMMAND);
			return;
		}
		try {

			var command = commands.shift();
			var data = qtil.CommandSplit(command, options.separator);
			if (Array.isArray(data)) {
				var re = options.server_command_path+data[1];
				if (typeof(require(re).naming) !== "function") {
					throw new Error(re+".naming is undefined");
				}
				data = require(re).naming(data);
			}
			if (data === false) {
				try {
					throw new Error("value is fault");
				} catch(errr) {
					var v = qtil.CommandSplit(command, options.separator);
					qtil.FailedCall(c, v, options, errr);
					NextLoop(_COMMAND);
					return;
				}
			}
			if (!!g_commands[data.command]) {
				try {
					var cmd  = g_commands[data.command];
					cmd(c, data, sql, options, function(){ NextLoop(_COMMAND); });
				} catch(errr) {
					qtil.FailedCall(c, data, options, errr);
					NextLoop(_COMMAND);
					return;
				}
			} else {
				throw new Error("command is not found");
			}

			return;

		} catch(err) {
			qtil.FailedCall(c, data, options, err);
			NextLoop(_COMMAND);
		}
	}

	//);

	c.on("data", function(e){
		buffer += e.toString();

		var tmp_commands = buffer.split(options.endpoint);

		buffer = tmp_commands[tmp_commands.length-1];
		tmp_commands.pop();
		tmp_commands.forEach(function(elem){
			qtil.log("1-> "+(elem+options.endpoint).replace(/\t/g,"\\t").replace(/\n/g,"\\n"),c);
			commands.push(elem);

			_COMMAND();
		});
	});

	c.on("error", function(e){
		qtil.log("error",c);
		qtil.log(e.toString("ascii"),c);
		// sql.end();
	});

};

(function(){
	if (cluster.isMaster) {
		(function(){
			var fs = require("fs");
			if (!!!fs.existsSync(options.server_log)) {
				fs.mkdirSync(options.server_log);
				fs.writeFileSync(options.server_access_log,"start\n");
				fs.writeFileSync(options.server_error_log,"start\n");
			}
		})();
	}

	if (!cluster.isMaster) {
		options.ports.forEach(function(elem,i){
			var net = require("net");
			net.createServer(s).listen(elem, function(){
				console.log("server start -> port:", elem);
				qtil.log("server start -> port: " + elem, {NPID: "SERVER"} );
			});
		});
	}

	// if (cluster.isMaster) {
	// 	(function(){
	// 		var hotreload = require("@ssmr9dt/hotreload");
	// 		var timeout = require("./lib/timeout.js");
	// 		var sql = new MySQLWrap(options,{NPID: "SERVER"});
	// 		(function _TIMEOUT(){
	// 			timeout.execute(sql);
	// 			hotreload("./lib/timeout.js", function(err, e){
	// 				if (!!err) { return; }
	// 				output("Updated timeout.js");
	// 				timeout = e;
	// 			});
	// 			setTimeout(_TIMEOUT,options.logintime_out*1000 + 100);
	// 		})();
	// 	})();
	// }

})();

