//
// This is QuakeShake.
//

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

// Shake criteria config
var pixPerSec = 20;
var timeStep = 1e3/pixPerSec;
var stationScalar = 3.20793 * Math.pow(10,5) * 9.8;
var MaxScale = 1.4; // new high if n% more than previous max
var MaxStale = 30000; // n seconds stale time for a recorded max
var MaxPackets = 5; // n packets before declaring an event
var curMax = 0;
var msgMax = {};
var jumpcounter = 0;

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

	/// START SHAKE
	var packet = JSON.parse(msg);
        var _decimate = packet.samprate / pixPerSec;
        var _i = 0;
        var _t = packet.starttime;
	var timeDiff = packet.endtime-packet.starttime;

	if (msgMax[makeChanKey(packet)]){ // not our first packet
		if (msgMax[makeChanKey(packet)].hasOwnProperty('value')) { // not our first max
			curMax = msgMax[makeChanKey(packet)].value;
		}
	} else {
		msgMax[makeChanKey(packet)] = {};
	}

        while (_i < packet.data.length) { // iterate thru all datapoints in this packet
            var _index = Math.round(_i += _decimate);
            if (_index < packet.data.length) {
		var curVal = Math.abs(packet.data[_index] / stationScalar); // this is the value we need
		if ( curVal > curMax * MaxScale ){ // if it jumps...
			msgMax[makeChanKey(packet)] = {value: curVal, timestamp: _t, reason: 'scale', previous: curMax}; // we have a new max!
		}
		if ( _t >= msgMax[makeChanKey(packet)].timestamp + MaxStale ) { // if it stinks...
			msgMax[makeChanKey(packet)] = {value: curVal, timestamp: _t, reason: 'stale', previous: curMax}; // we have a new max!
		}
                _t += timeStep;
            }
        }

	// Let's analyze what happened with stations in this packet
	var alljump = true;
	for (var key in msgMax) { // analyze all stations
		if (msgMax[key].hasOwnProperty('reason') && jumpcounter == 0) {
			alljump = alljump && ((msgMax[key].reason == 'scale') && msgMax[key].previous > 0);
		}
	}

	if (alljump) { // we might have an event
		++jumpcounter;
		if (jumpcounter >= MaxPackets) { // we have an event
			var dt = new Date();
			var txt = "15% jump seen: " + dt.toString();
			var pk = { notification: txt, show: true };
			serviceBusService.sendTopicMessage(config.AzureTopic, { body: JSON.stringify(pk) }, function(error) {
			      if (error) { console.log(error); } else { console.log("Sent to Azure"); }
			});
			jumpcounter = 0;
		}
	}
	/// END SHAKE
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

// Shake utilities
makeTimeKey = function(t) {
	return parseInt(t / timeStep, 0) * timeStep;
};
makeChanKey = function(packet) {
        //remove the dashes that are the default for loc = null
        var loc = (!packet.loc || packet.loc == "--" || this.loc == "") ? "" : ("_" + packet.loc);
        return packet.sta.toLowerCase() + "_" + packet.chan.toLowerCase() + "_" + packet.net.toLowerCase() + loc;
};
