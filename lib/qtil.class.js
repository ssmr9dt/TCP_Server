var crypto = require("crypto");
var fs = require("fs");
var op = require("./../config.js");

module.exports.CommandSplit = function(command, separator) {
    separator = separator || "<>";
    var tmp = command.split(separator),
		datas = [];

	datas[0] = command;
	for (var i=0; i<tmp.length; i++) {
		datas[datas.length] = tmp[i];
	}
	return datas;
};

module.exports.GetEpochTime = function(time){
	var d = new Date();
	if (!!time) {
		d = new Date(time);
	}
	return (d.getTime() - (d.getTimezoneOffset() * 60000));
}

module.exports.CreateMD5 = function(src){
	var md5 = crypto.createHash("md5");
	md5.update(src, "utf8");
	return md5.digest("hex");
};

module.exports.MakeGUID = function(){
	var s4 = function(){ return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); };

	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

module.exports.CalcResponseTime = function(time){
	return (function(){ var This = {time_s: (new Date()).getTime(), Finish: function(){ return (new Date()).getTime() - this.time_s; }}; return This; })();
};

module.exports.log = function(e,c){
	if (false) {return;}

	var date = (function(d){ return [d.getFullYear(),d.getMonth()+1,d.getDate()].join("/")+" "+d.toLocaleTimeString(); })(new Date());
	var ip = "";
	if (!!c) { ip = c.NPID || c.remoteAddress || c._peername.address; }
	var log = date + " " + ip + " " + e + "\n";
	//if (!!e && (e.indexOf("1-> ") !== -1 || e.indexOf("2-> ") !== -1)) {
	//	log = date + " " + ip + " " + e.length + " " + e + "\n";
	//}
	fs.appendFile(op.server_access_log, log, function(){});
};


module.exports.Send = function(c,command,t){
	var v = command;
	if (typeof(command) === "object") {
		v = command.join(op.separator);
	}

	t = t || "";
	if (t !== "") { t = t+" "; }

	module.exports.log(t+"2-> "+v.replace(/\t/g,"\\t").replace(/\n/g,"\\n")+op.endpoint,c);
	c.write(v+op.endpoint);
};

//ErrorCode
module.exports.NOERROR = 0;
module.exports.UNKNOWN = 1;
module.exports.NODATA  = 2;
module.exports.DIFFERENTGENERATION = 3;
module.exports.FailedResponse = function(c,data,err){
	module.exports.Send(c, [data.command || data[1],"ERROR:"+err]);
};

module.exports.errorlog = function(person, cmd, errormessage){
	var date = (function(d){ return [d.getFullYear(), d.getMonth()+1,d.getDate()].join("/")+" "+d.toLocaleTimeString(); })(new Date());

	var log = date + " " + person;
	if (!!cmd && !!errormessage) {
		log += " " + cmd + "\n" + errormessage + "\n";
	} else {
		log += "\n" + cmd + "\n";
	}
	fs.appendFile(op.server_error_log, log+"\n", function(){});
	console.log(log);
};

module.exports.FailedCall = function(c,data,options,err,sendskip){
	if (!!!sendskip) {
		module.exports.FailedResponse(c, data, module.exports.UNKNOWN);
	}

	var cmd = data.command || data[1];

	if (!!err) {
		err = err || "";
		err = err.stack || err;
		var ip = "";
		if (!!c && !!c.remoteAddress) { ip = c.remoteAddress; }
		if (!!c && !!c.NPID) { ip = c.NPID; }
		var dumpdata = require("util").inspect(data);
		module.exports.errorlog(ip, cmd, err+"\n"+dumpdata);
	}
};
