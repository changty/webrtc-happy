Happy = function(options) {
	var self = this; 

	this.options = {
		server: 'http://192.168.0.16:3333',
		localVideo: $('.localVideo')[0],
		remoteVideo: $('.remoteVideo')[0]
	}

	$.extend(this.options, options);

	this.localVideo = this.options.localVideo;
	this.remoteVideo = this.options.remoteVideo;

	this.localStream; 
	this.remoteStream;

	this.isChannelReady; 
	this.isInitiator = false; 
	this.isStarted = false;
	this.turnReady; 

	this.pc; // Peer connection
	this.pc_config = {'iceServers': 
						[{'url': 'stun:stun.l.google.com:19302'},
						{
							url: 'turn:numb.viagenie.ca',
							credential: 'muazkh',
							username: 'webrtc@live.com'
						},
						{
							url: 'turn:192.158.29.39:3478?transport=udp',
							credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
							username: '28224511:1379330808'
						},
						{
							url: 'turn:192.158.29.39:3478?transport=tcp',
							credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
							username: '28224511:1379330808'
						}]
					};
	this.pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};

	// Set up audio and video regardless of what devices are present.
	var sdpConstraints = {
		'mandatory': {	
			'OfferToReceiveAudio':true,
			'OfferToReceiveVideo':true
		}
	};

	// for testing purposes only, room handling needs to be done in a different manner
	this.room = "my testing room";

	// connect to socket server
	this.socket = io();

	// make sure we are connected, before doing anything else
	this.socket.on('server started', function() {
		self.trace('Socket server is ready');
		self.socket.emit('create or join', self.room);
	});

	// handle refershing the page
	window.onbeforeunload = function(e){
		self.sendMessage({type: 'bye', room: self.room});
	}

	// socket io responses
	this.socket.on('created', function (room){
		self.trace('Created room ' + room);
		self.isInitiator = true;
	});

	this.socket.on('full', function (room){
		self.trace('Room ' + room + ' is full');
	});

	this.socket.on('joined', function (data){
		self.trace('This peer has joined room ' + data.room, data);
		self.isChannelReady = true;
	});

	this.socket.on('message', function(message){
		self.trace('Client received a message: ', message); 

		if (message.type == 'got user media') {
			self.maybeStart();
		}

		else if (message.type === 'offer' || message.type === 'sessionDescription') {
			if(!self.isInitiator && !self.isStarted) {
				self.maybeStart(); 
			}

			self.pc.setRemoteDescription(new RTCSessionDescription(message.data));
			self.doAnswer(); 
		}

		else if (message.type === 'answer' && self.isStarted) {
			self.setRemoteDescription(new RTCSessionDescription(message.data));
		}

		else if (message.type === 'candidate' && self.isStarted) {
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			self.pc.addIceCandidate(candidate);
		}

		else if (message.type === 'bye' && self.isStarted) {
			self.handleRemoteHangup();
		}
	});

}


Happy.prototype.sendMessage = function(message) {
	var self = this; 

	self.trace('Client sending a message: ', message); 
	self.socket.emit('message', message);
}

Happy.prototype.handleUserMedia = function(stream) {
	var self = this; 

	self.trace('Adding local stream'); 
	self.localVideo.src = window.URL.createObjectURL(stream); 
	self.localStream = stream; 
	
	self.sendMessage({type: 'got user media'}); 
	if(self.isInitiator) {
		self.maybeStart();
	}
}

Happy.prototype.handleUserMediaError = function(error) {
	var self = this; 

	self.trace('getUserMedia error: ', error);
}


// This is still missing...
// var constraints = {video: true};
// getUserMedia(constraints, handleUserMedia, handleUserMediaError);

// console.log('Getting user media with constraints', constraints);

// if (location.hostname != "localhost") {
//	 requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
// }

Happy.prototype.maybeStart = function() {
	var self = this; 

	var constraints = {video: true}; 
	getUserMedia(constraints, self.handleUserMedia.bind(self), self.handleUserMediaError.bind(self));

	// if (location.hostname != "localhost") {
	// 	self.requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
	// }

	if(!self.isStarted && typeof self.localStream != 'undefined' && self.isChannelReady) {
		self.createPeerConnection(); 
		self.pc.addStream(self.localStream); 
		self.trace('OK, lets go');
	}
	else {
		self.trace('Something is missing...', !self.isStartd + " " + self.localStream + " " + self.isChannelReady);
	}
}


Happy.prototype.createPeerConnection = function () {
	var self = this; 

	try {
		self.pc = new RTCPeerConnection(null); 
		self.pc.onicecadidate = self.handleIceCandidate.bind(self); 
		self.pc.onaddstream = self.handleRemoteStreamAdded.bind(self); 
		self.pc.onremovestream = self.handleRemoteStreamRemoved.bind(self); 

		self.trace('Created RTCPeerConnection'); 
	} catch (e) {
		self.trace('Failed to create PeerConnection exception: ', e.message); 
		return; 
	}
}

Happy.prototype.handleIceCandidate = function(event) {
	var self = this; 

	self.trace('handleIceCandidate event: ', event); 
	if(event.candidate) {
		sendMesasge({
			room: self.room,
			type: 'candidate',
			label: event.candidate.sdpMLineIndex,
			id: event.candidate.sdpMid,
			candidate: event.candidate.candidate
		});
	}
	else {
		self.trace('End of candidates');
	}
}

Happy.prototype.handleRemoteStreamAdded = function(event) {
	var self = this; 

	self.remoteVideo.src = window.URL.createObjectURL(event.stream); 
	self.remoteStream = event.stream; 
}

Happy.prototype.handleCreateOfferError = function(event) {
	var self = this; 
	self.trace('createOffer() error: ', e);
}

Happy.prototype.doCall = function() {
	var self = this; 

	self.trace('Sending offer to peer'); 

	self.pc.createOffer(self.setLocalAndSendMessage.bind(self), self.handleCreateOfferError.bind(self));
}

Happy.prototype.doAnswer = function() {
	var self = this; 

	self.trace('Sending answer to peer'); 
	self.pc.createAnswer(self.setLocalAndSendMessage.bind(self), null, self.sdpConstraints);
}

Happy.prototype.setLocalAndSendMessage = function(sessionDescription) {
	var self = this; 

//	sessionDescription.sdp = self.preferOpus(sessionDescription.sdp);
	// sessionDescription.sdp = (sessionDescription.sdp);

	self.pc.setLocalDescription(sessionDescription); 
	self.trace('setLocalAndSendMessage sending message ', sessionDescription); 

	self.sendMessage({room: self.room, type: 'sessionDescription', data: sessionDescription});
} 

Happy.prototype.requestTurn = function(turn_url) {
	var self = this; 

	var turnExists = false; 
	for (var i in self.pc_config.iceServers) {
		if(self.pc_config.iceServers[i].url.substr(0,5) === 'turn') {
			turnExists = true; 
			self.turnReady = true;
			break; 
		}
	}

	// if(!turnExists) {
	// 	self.trace('Getting TURN server from ', turn_url); 
	// 	//No TURN server, get one from computeeingineondemand.appspot.com: 
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.onreadystatechange = function() {
	// 		if (xhr.readyState === 4 && xhr.status === 200) {
	// 			var turnServer = JSON.parse(xhr.responseText);
	// 			self.trace('Got TURN server: ', turnServer);
	// 			self.pc_config.iceServers.push({
	// 				'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
	// 				'credential': turnServer.password
	// 			});
	// 			turnReady = true;
	// 		}
	// 	};
	// 	xhr.open('GET', turn_url, true);
	// 		xhr.send();
	// 	}

}


Happy.prototype.handleRemoteStreamAdded = function(event) {
	var self = this; 

	self.trace('Remote stream added')
	self.remoteVideo.src = window.URL.createObjectURL(event.stream); 
	self.remoteStream = event.stream; 
}

Happy.prototype.handleRemoteStreamRemoved = function(event) {
	var self = this; 

	self.trace('Remote stream removed. Event: ', event); 
}

Happy.prototype.hangup = function() {
	var self = this; 

	self.trace('Hanging up'); 
	self.stop(); 
	self.sendMessage({room: self.room, type: 'bye'});
}

Happy.prototype.handleRemoteHangup = function() {
	var self = this; 

	self.trace('Remote hangup');
}

Happy.prototype.stop = function() {
	var self = this; 

	self.isStarted = false; 
	self.pc.close(); 
	self.pc = null; 
}

///////////////////////////////////////////////////////////////////////////

// Set Opus as the default audio codec, if it's available
Happy.prototype.preferOpus = function(sdp) {
	var self = this; 

	var sdpLines = sdp.split('\r\n');
	var mLineIndex; 

	// Searc for m line. 
	for (var i=0; i < sdpLines.length; i++) {
		if(sdpLines[i].search('m=audio') !== -1) {
			mLineIndex = i; 
			break; 
		}
	}

	if(mLineIndex === null) {
		return sdp;
	}

	// if Opus is available, set it as the default in m line 
	for (var i=0; i<sdpLines.length; i++) {
		if(sdpLines[i].search('opus/48000') !== -1) {
			var opusPayload = self.extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
			if(opusPayload) {
				sdpLines[mLineIndex] = self.setDefaultCodec(sdpLines[mLineIndex], opusPayload);
			}
			break;
		}
	}

	// Remove CN in m line and sdp
	sdpLines = self.removeCN(sdpLines, mLineIndex); 
	sdp = sdpLines.join('\r\n'); 
	return sdp;
}

Happy.prototype.extractSdp = function(sdpLine, pattern) {
	var self = this; 

	var result = sdpLine.match(pattern); 
	return result && result.length === 2 ? result[1] : null; 
}

// Set the selected codec to the first in m line 
Happy.prototype.setDefaultCodec = function(mLine, payload) {
	var self = this; 

	var elements = mLine.split(' '); 
	var newLine = []; 
	var index = 0; 

	for(var i=0 ;i<elements.length; i++) {
		if(index === 3) { // Format of media starts from the fourth
			newLine[index++] = payload; 
		}
		if(elements[i] !== payload) {
			newLine[index++] = elements[i];
		}
	}

	return newLine.join(' ');
}
 
// Strip CN from sdp before CN constraints is ready
Happy.prototype.removeCN = function(sdpLines, mLineIndex) {
	var self = this; 

	var mLineElements = sdpLines[mLineIndex].split(' ');
	//Scan from the end for the convenience of removing an item
	for(var i=sdpLines.length-1; i>=0; i--) {
		var payload = self.extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i); 
		if(payload) {
			var cnPos = mLineElements.indexOf(payload); 
			if(cnPos !== -1) {
				//Remove CN payload from the m line.
				mLineElements.splice(cnPos, 1); 
			}
			
			//Remove CN line in sdp
			sdpLines.splice(i, 1); 
		}
	}

	sdpLines[mLineIndex] = mLineElements.join(' ');
	return sdpLines;
}

// Happy.prototype.addMedia = function(opts) {
// 	var self = this;
// 	var options = {
// 		video: true,
// 		audio: true
// 	};

// 	$.extend(options, opts); 

// 	navigator.getUserMedia = navigator.getUserMedia ||
// 		navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// 	var constraints = {video: options.video, audio: options.audio};

// 	function successCallback(localMediaStream) {
// 		self.trace("Received local stream"); 
// 		self.localVideo.src = URL.createObjectURL(localMediaStream); 
// 		self.localVideo.play();
// 		self.localStream = localMediaStream; 
// 	}


// 	function errorCallback(error){
// 		self.trace("navigator.getUserMedia error: ", error);
// 	}

// 	navigator.getUserMedia(constraints, successCallback, errorCallback);

// }

Happy.prototype.trace = function(text, obj) {
	console.log((performance.now() / 1000).toFixed(3) + ": " + text, obj);
}


// Happy.prototype.start = function() {
// 	var self = this;

// 	self.trace("Requesting local stream"); 
// 	self.addMedia();
// }

// Happy.prototype.call = function() {
// 	var self = this;

// 	self.trace("Starting call");

// 	console.log(self.localStream);

// 	if(self.localStream.getVideoTracks().length > 0) {
// 		self.trace('Using video device: ', self.localStream.getVideoTracks()[0].label);
// 	}
// 	if(self.localStream.getAudioTracks().length > 0) {
// 		self.trace('Using audio device: ', self.localStream.getAudioTracks()[0].label);
// 	}

// 	var servers = null; 
// 	self.localPeerConnection = new RTCPeerConnection(servers);
// 	self.trace('Created local peer connection object localPeerconnection');
// 	self.localPeerConnection.onicecadidate = self.gotLocalIceCandidate.bind(self);

// 	self.remotePeerConnection = new RTCPeerConnection(servers);
// 	self.trace("Created remote peer connection object remotePeerConnection");
// 	self.remotePeerConnection.onicecandidate = self.gotRemoteIceCandidate.bind(self);
// 	self.remotePeerConnection.onaddstream = self.gotRemoteStream.bind(self);


// 	self.localPeerConnection.addStream(self.localStream);
// 	self.trace("Added localStream to localPeerConnection");
// 	self.localPeerConnection.createOffer(self.gotLocalDescription.bind(self), self.handleError.bind(self));
// }

// Happy.prototype.hangup = function() {
// 	var self = this; 

// 	self.trace('Ending call...');
// 	self.localPeerConnection.close();
// 	self.remotePeerConnection.close();
// 	self.localPeerConnection = null;
// 	self.remotePeerConnection = null;
// }

// Happy.prototype.gotLocalDescription = function(description) {
// 	var self = this;

// 	self.localPeerConnection.setLocalDescription(description);
// 	self.trace("Offer from localPeerConnection: \n", description.sdp);
// 	self.remotePeerConnection.setRemoteDescription(description);
// 	self.remotePeerConnection.createAnswer(self.gotRemoteDescription.bind(self),self.handleError.bind(self));
// }

// Happy.prototype.gotRemoteDescription = function(description) {
// 	var self = this;

// 	self.remotePeerConnection.setLocalDescription(description);
// 	self.trace("Answer from remotePeerConnection: \n", description.sdp);
// 	self.localPeerConnection.setRemoteDescription(description);
// }

// Happy.prototype.gotRemoteStream = function(event) {
// 	var self = this;
// 	self.remoteVideo.src = URL.createObjectURL(event.stream);
// 	self.trace("Received remote stream");
// }


// Happy.prototype.gotLocalIceCandidate = function(event) {
// 	var self = this;

// 	if (event.candidate) {
// 		self.remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
// 		self.trace("Local ICE candidate: \n", event.candidate.candidate);
// 	}
// }

// Happy.prototype.gotRemoteIceCandidate = function(event){
//	 var self = this;

// 	if (event.candidate) {
// 		self.localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
// 		self.trace("Remote ICE candidate: \n ", event.candidate.candidate);
// 	}
// }

// Happy.prototype.handleError = function(){}