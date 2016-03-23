# thorio.tcpclient

##About

TCPClient for thor.io - used to connect to a server ThorIO.TCPServer (Engine endpoint).

The ThorIO.TCPClient is a complement to the ThorIO.Client (WebSocket) that enables you to connect to a thor.io using a raw `socket` .  See the wiki pages of thor.io for futher information - https://github.com/MagnusThor/thorio/wiki


##Example


This example shows how to use the ThorIO.TCPClient 

    var thorIO = require("tthorio-tcpclient");
    // ctor host, port and Controller (channel) 
 
    var client = new thorIO.TcpClient("localhost", "4502", "foo");
    client.onopen = function(ci) {
	  console.log("connected to endpoint and 'foo' controller/channel", ci);
	
    // add a listener for "say"

	client.setProperty("age", 11);

	client.on("say", function(data) {
		console.log("say", data);
	});

	setInterval(function() {
		client.invoke("sayTo", {
			message: "foo",
			created: new Date()
		});
	 }, 4000);
    };

    client.onclose = function() {
	 console.log("connection to enpoint closed...");   
    };

    client.connect(); // open the connection
    
    
