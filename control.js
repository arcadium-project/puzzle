/* Steps for application
 * 1. Wait for a connection
 * 2. Generate problem ID
 * 3. Wait for payment to smart contract associated with problem ID
 * 4. Generate random image and send to client and start timer
 * 5. Listen for updates on solution
 * 6. Calculate reward based on time to completion or percent completion and tell smart contract to pay the user
 */
// Generate Problem ID

const fs = require('fs');
const cryptoRandomString = require('crypto-random-string');
var imgGen = require('js-image-generator');

// read ssl certificate
var privateKey = fs.readFileSync('ssl-cert/privkey.pem', 'utf8');
var certificate = fs.readFileSync('ssl-cert/fullchain.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };
var https = require('https');

//pass in your credentials to create an https server
var httpsServer = https.createServer(credentials);
httpsServer.listen(91443);

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: httpsServer
});

var sessions;

wss.on('connection', function connection(ws) {
	var pid = "";
    ws.on('message', function incoming(message) {
    	if (message.startsWith("$session: ")) {	
    		if (pid == "") {
	    		var next = message.substring(10);
	    		if (next.equals("new")) {
	    			// Start a new session by generating a problem ID
	    			var tpid = cryptoRandomString({length: 32});
	    			while (sessions[tpid] != null) {
	    				tpid = cryptoRandomString({length: 32});
	    			}
	    			pid = tpid;
	    			// Eventually this part will be moved and the next step will be to check to see if the payment has been sent
	    			ws.send("$init #" + tpid, function() {
	    				// I'll want to replace this random image generation function with a more robust one
						imgGen.generateImage(800, 600, 80, function(err, image) {
							ws.send(image, function() {
				 				var problem = new Object();
								problem.pid = pid;
								problem.image = image;
								problem.start = Date.now();
								sessions[pid] = problem;
							});	
						});
					});
	    		} else if (next.startsWith("#")) {
	    			// Get problem ID and if it exist, send the details
	    		} else {
	    			// Invalid
	    		}
	    	} else {
	    		// There's already a problem ID assigned!
	    	}
    	}
    });
});