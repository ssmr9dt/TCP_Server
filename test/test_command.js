const net = require('net');
const options = require("../config.js");
const d = require("domain").create();

options.ports.forEach(function(port){
  d.on("error", function(e){
  	console.error("Error:", e.message);
  });
  
  d.run(function(){
		const client = new net.Socket();
		client.setEncoding('utf8');
	
		client.connect(port, "localhost", d.bind(function(err,data){
			console.log("connected to server => port:" + port);
			client.write("TEST" + options.endpoint);
		}));
		
		client.on('data', d.bind(function(data){
		  console.log("client -> receive: " + data);
		  console.log("Success");
		  client.end();
		}));
  });
});