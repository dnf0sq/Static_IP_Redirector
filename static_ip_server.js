/*

	Author: 	 Erik Lončarek
	Title: 		 Static IP redirector
	Description: Node.JS based server and client scripts, in which
					server forwards traffic using iptables to the
					client on specified ports, and updates clients
					IP when it changes.
	Date: 		 2nd of February 2014
	Version: 	 1.0
	Notes: 		 Node module(s) required to run: sprintf, socket.io
					- Use "npm install sprintf socket.io"

*/

if(typeof String.prototype.rmlspaces!="function"){String.prototype.rmlspaces=function(){return this.replace(/^\s+|\s+$/g,"")}}if(typeof String.prototype.startsWith!="function"){String.prototype.startsWith=function(e){return this.indexOf(e)==0}}if(typeof String.prototype.contains!="function"){String.prototype.contains=function(e){return this.indexOf(e)!=-1}}if(typeof String.prototype.firstWord!="function"){String.prototype.firstWord=function(){if(this.contains(" ")){return this.substr(0,this.indexOf(" ")).rmlspaces()}else{return this.substr(0).rmlspaces()}}}if(typeof String.prototype.rmFirstWord!="function"){String.prototype.rmFirstWord=function(){return this.substr(this.indexOf(" ")+1).rmlspaces()}}if(typeof String.prototype.multiword!="function"){String.prototype.multiword=function(){return this.indexOf(" ")!=-1}}

// ### Begin Variables and load config ###

var conf = {
	fports: 	  [80, 3306],
	tports: 	  [80, 3306],
	myExtIP: 	  '37.187.203.11',
	lastIP: 	  '89.164.252.204',
	strIPTables:  'iptables -t nat -%s PREROUTING -p tcp -d %s --dport %s -j DNAT --to-destination %s:%s'
};

var sys 	= require('sys'),
	sprintf	= require('sprintf').sprintf,
	exec 	= require('child_process').exec,
	httpsv 	= require('http').createServer(),
	io 		= require('socket.io').listen(httpsv, { log: false } );

var pause 	= 0;
var ipqueue = [];
var stdin 	= process.openStdin();

// ### End Variables and load config ###


// ### Begin Initialization ###

httpsv.listen(41298, conf.myExtIP);
console.log('Static IP server started!');

// ### End Initialization ###


// ### Begin Functions ###

function rmPort(ip, fromport, toport) {
	exec(sprintf(conf.strIPTables, 'D', conf.myExtIP, fromport, conf.lastIP, toport));
	console.log(sprintf('Stopped forwarding %d -> %d', fromport, toport));
}

function fwPort(ip, fromport, toport) {
	if(!toport) toport = fromport;
	fromport = fromport.toString();
	toport   =   toport.toString();
	exec(sprintf(conf.strIPTables, 'D', conf.myExtIP, fromport, conf.lastIP, toport));
	exec(sprintf(conf.strIPTables, 'A', conf.myExtIP, fromport, ip    , toport));
	console.log(sprintf('Forwarded %s:%s -> %s:%s', conf.myExtIP, fromport, ip, toport));
}

function fwAllPorts(ip) {
	for(var i = 0; i < conf.fports.length; ++i) {
		fwPort(ip, conf.fports[i], conf.tports[i]);
	}

	conf.lastIP = ip;
}

function exit() {
	for(var i = 0; i < conf.fports.length; ++i) {
		rmPort(conf.lastIP, conf.fports[i], conf.tports[i]);
	}

	console.log('Shutting down...');
	process.exit();
}

// ### End Functions ###


// ### Begin Events ###

stdin.addListener("data", function(d) {
	d = d.toString().substring(0, d.length-1);
	switch(d.firstWord().toLowerCase()) {
		case 'lastip': case 'last': {
			console.log("Last IP: " + conf.lastIP);
			break;
		}
		case 'ports': case 'port': {
			console.log("Current routes are:");
			for(var i = 0; i < conf.fports.length; ++i) {
				console.log(sprintf('    %d: %d -> %d', i, conf.fports[i], conf.tports[i]));
			}
			console.log(' -- ');
			break;
		}
		case 'add': {
			if(!d.multiword()) {
				console.log('Please specify the "ID" argument.')
				break;
			}
			d = d.rmFirstWord();
			var sp = d.split(' ');
			if(sp.length == 1) {
				conf.fports.push(parseInt(sp[0]));
				conf.tports.push(parseInt(sp[0]));
				console.log(sprintf('Added rule "%d -> %d"', conf.fports[conf.fports.length - 1], conf.tports[conf.tports.length - 1]));
			} else if(sp.length == 2) {
				conf.fports.push(parseInt(sp[0]));
				conf.tports.push(parseInt(sp[1]));
				console.log(sprintf('Added rule "%d -> %d"', conf.fports[conf.fports.length - 1], conf.tports[conf.tports.length - 1]));
			} else {
				console.log("Invalid number of arguments. Specify one or two.");
			}
			break;
		}
		case 'remove': case 'rm': {
			if(!d.multiword()) {
				console.log('Please specify the "ID" argument.')
				break;
			}
			d = d.rmFirstWord();
			d = parseInt(d);
			if(!conf.fports[d]) {
				console.log('No element with that index.');
				break;
			}
			rmPort(conf.lastIP, conf.fports[d], conf.tports[d]);
			conf.fports.splice(d, 1);
			conf.tports.splice(d, 1);
		}
		case 'pause': {
			pause = 1;
			break;
		}
		case 'cresume': {
			if(!pause) {
				console.log('Not paused.');
				break;
			}
			pause = 0;
			ipqueue = [];
			console.log('Resumed.');
			break;
		}
		case 'stop': case 'shutdown': {
			exit();
			break;
		}
		case 'resume': {
			if(!pause) {
				console.log('Not paused.');
				break;
			}
			pause = 0;
			while(q = ipqueue.pop()) {
				fwAllPorts(q);
			}
			console.log('Resumed.');
			break;
		}
		case 'queue': {
			if(ipqueue.length == 0) {
				console.log("The current queue is empty.");
				break;
			}
			console.log("The current queue is:");
			for(var i = 0; i < ipqueue.length; ++i) {
				console.log(sprintf('    Redirect all current ports to %s', ipqueue[i].IP));
			}
			break;
		}
		case 'shift': {
			if(ipqueue.length == 0) {
				console.log('Queue is empty.');
				break;
			}
			ipqueue.shift();
			break;
		}
		case 'pop': {
			if(ipqueue.length == 0) {
				console.log('Queue is empty.');
				break;
			}
			ipqueue.pop();
			break;
		}
		case 'help': {
			var help = {};
			help.CMDS = [];
			help.addCmd = function(cmd, desc) {
				help.CMDS.push( { COMMAND: cmd, DESCRIPTION: desc } );
			}

			help.addCmd('lastip/last', 'Last IP that has been forwarded to.');
			help.addCmd('ports/port', 'List all the ports that forwarding has been enabled to.');
			help.addCmd('pause', 'Pause new forwarding requests.');
			help.addCmd('cresume', 'Resume new forwarding requests, but disregard the ones received under pause.');
			help.addCmd('queue', 'Show the queue of pending requests.');
			help.addCmd('pop', 'Remove the last element of the queue.');
			help.addCmd('shift', 'Remove the first element of the queue.');
			help.addCmd('remove/rm', 'Stop forwarding the port at specified index.');
			help.addCmd('add', '[port | from port, to port] - forward another port.');
			help.addCmd('stop/shutdown', 'Stops forwarding and shuts down the server.');

			var maxCmdLength = 0;
			for(var i = 0; i < help.CMDS.length; ++i) {
				var n = help.CMDS[i].COMMAND.length;
				maxCmdLength = n > maxCmdLength ? n : maxCmdLength;
			}

			++maxCmdLength;

			for(var i = 0; i < help.CMDS.length; ++i) {
				while(help.CMDS[i].COMMAND.length != maxCmdLength) {
					help.CMDS[i].COMMAND += ' ';
				}
				console.log("    " + help.CMDS[i].COMMAND + help.CMDS[i].DESCRIPTION);
			}
			break;
		}
	}
});

io.sockets.on('connection', function(socket) {
	socket.IP = socket.handshake.address.address;
	console.log(sprintf('Socket %s connected.', socket.IP));

	socket.on('chip', function() {
		if(pause) {
			console.log('Got change IP event, but pause was enabled.');
			console.log('Type resume to cresume and disregard previous change IP requests or resume to process them. Type queue to examine the current requests.');
			ipqueue.push( { IP: socket.IP, SOCKET: socket });
			return;
		}
		fwAllPorts(socket.IP);
	});
});

process.on('SIGINT', function() {
	console.log('');
	console.log(' --- Received SIGINT! ---');
	exit();
});

// ### End Events ###