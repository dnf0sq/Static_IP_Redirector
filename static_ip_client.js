/*

	Author: 	 Erik Lončarek
	Title: 		 Static IP redirector
	Description: Node.JS based server and client scripts, in which
					server forwards traffic using iptables to the
					client on specified ports, and updates clients
					IP when it changes.
	Date: 		 2nd of February 2014
	Version: 	 1.0
	Notes: 		 Node module(s) required to run: socket.io
					- Use "npm install socket.io-client"

*/

var host 	= '37.187.203.11';
var port    = 41298;


var io		= require('socket.io-client');
var socket 	= io.connect(host + ':' + port);

console.log('Static IP client running.');

socket.on('connect', function() {
	socket.emit('chip');
});