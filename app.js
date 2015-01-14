var http    = require('http');
var redis   = require('redis');
var express = require('express');
var azure   = require('azure');

var WebSocketServer = require('ws').Server;

var config = require("./config.js");

// Initialize servers and application
var app = express();
app.use(express.static(__dirname + '/slurp/mobile')); // Change to /public in production
// app.use(express.static(__dirname + '/public')); // Change to /public in production

var server = http.createServer(app);
server.listen(process.env.PORT || config.port); // Azure Web Sites sets env.PORT, otherwise use config

wss = new WebSocketServer({ server: server });

// Defines broadcast function
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

// Initializes redis connection
var sub = redis.createClient(config.redisPort, config.redisHost);
sub.subscribe(config.key);
sub.setMaxListeners(0);

// Initializes Azure
var serviceBusService = azure.createServiceBusService(config.AzureEndpoint);

// Global utility variables
var connectCounter = 0;

// New websocket client
wss.on('connection', function(client){
	console.log("[" + process.pid + "] ws client connected. total: " + connectCounter);
	connectCounter++;
	client.on('disconnect', function() {
        	connectCounter--;
	});
});

// New redis message
sub.on('message', function(channel, msg) {
	//io.sockets.send(msg);
	wss.broadcast(msg);
});

// Check ASB
function checkAzure() {
	return serviceBusService.receiveSubscriptionMessage(config.AzureTopic, config.AzureSub, function(error, azmsg){
		if (error && error != "No messages to receive") {
			console.log(error);
		} else if (azmsg) {
			wss.broadcast(azmsg.body);
		}
	});
}

setInterval(checkAzure, 5000);

// A stub for handling other redis events in the future
sub.on('connect'     , log('connect'));
sub.on('reconnecting', log('reconnecting'));
sub.on('error'       , log('error'));
sub.on('end'         , log('end'));

function log(type) { // the redis modules like this instead of console.log()
    return function() {
        console.log(type, arguments);
    }
}
