
module.exports.naming = function(v){
	for (var i=0; i<2; i++) {
		if (!!!v[i]) { return false; }
	}

	var data = {};
	data.raw	= v[0];
	data.command= v[1];
	return data;
};

module.exports.command = function(c,data,sql,options,callback){
	var qtil = require("./../lib/qtil.class.js");

	var domain = require("domain").create();
	domain.on("error", function(e){
		qtil.FailedCall(c,data,options,e);
		callback();
	});

	domain.run(function(){
		qtil.Send(c,[data.raw]);
		callback();
		setTimeout(function(){
			c.cluster.worker.send("exit");
		}, 100);
	});
};
