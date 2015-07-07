Happy = function(options) {
	var self = this; 

	this.options = {
		server: 'http://192.168.0.16:3333',
		localVideo: $('.localVideo')[0],
		remoteVideo: $('.remoteVideo')[0],
		myAddress: "my-default-room" 
	}

	$.extend(this.options, options);

	this.localVideo = this.options.localVideo;
	this.remoteVideo = this.options.remoteVideo;

	this.localStream; 
	this.remoteStream;

	// this.isChannelReady = false; 
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
	this.myHappyAddress = this.options.defaultRoom;

	// connect to socket server
	this.socket = io();

	// make sure we are connected, before doing anything else
	this.socket.on('server started', function() {
		self.trace('Socket server is ready');
		// self.socket.emit('create or join', self.room);
	});

	// handle refershing the page
	window.onbeforeunload = function(e){
		self.sendMessage({type: 'bye'});
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
		// self.isChannelReady = true;
	});

	this.socket.on('message', function(message){
		// self.trace('Client received a message: ', message); 

		if (message.type == 'got user media') {
			self.trace('Got user media', message);
			self.maybeStart();
		}

		else if (message.type === 'offer') {
			// self.isChannelReady = true;
			self.trace('Offer ', message);
			self.forwardTo = message.from;

			if(!self.isInitiator && !self.isStarted) {
				self.maybeStart(); 
				self.pc.setRemoteDescription(new RTCSessionDescription(message.data));
			}

			self.ring();
			// self.doAnswer(message.from);
		}

		else if (message.type === 'answer' && self.isStarted) {
			self.trace('Answer', message);
			self.pc.setRemoteDescription(new RTCSessionDescription(message.data));
		}

		else if (message.type === 'candidate' && self.isStarted) {
			self.trace('ICECandidate: ', message)
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			self.pc.addIceCandidate(candidate);
		}

		else if (message.type === 'bye' && self.isStarted) {
			self.trace('Bye...', message);
			self.handleRemoteHangup();
		}
		else {
			self.trace(' >>>> Other message: ', message);
		}
	});

	self.prepareCall();
}

Happy.prototype.prepareCall = function() {
	var self = this; 

	var constraints = {video: true}; 
	getUserMedia(constraints, self.handleUserMedia.bind(self), self.handleUserMediaError.bind(self));

	if (location.hostname != "localhost") {
		self.requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
	}
}


Happy.prototype.sendMessage = function(message) {
	var self = this; 

	message.from = self.myHappyAddress;
	message.to = self.forwardTo; 
	self.trace('Client sending a message: ', message); 
	self.socket.emit('message', message);
}

Happy.prototype.handleUserMedia = function(stream) {
	var self = this; 

	self.trace('Adding local stream'); 
	self.localVideo.src = window.URL.createObjectURL(stream); 
	self.localVideo.play();
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

	// removed: && typeof self.localStream != 'undefined' and self.isChannelReady also
	if(!self.isStarted) {
		self.createPeerConnection(); 

		// you don't need to send stream, if device is not available
		if(self.localStream != 'undefined' && self.localStream != null) {
			self.pc.addStream(self.localStream); 
		}
		self.isStarted = true;
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
		self.pc.onicecandidate = self.handleIceCandidate.bind(self); 
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
		self.sendMessage({
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


Happy.prototype.handleCreateOfferError = function(event) {
	var self = this; 
	self.trace('createOffer() error: ', e);
}

Happy.prototype.doCall = function(to) {
	var self = this; 

	if(!self.pc) {
		self.maybeStart();
	}

	self.forwardTo = to; 

	self.trace('Creating offer to peer ', to); 
	self.pc.createOffer(self.setLocalAndSendMessage.bind(self), self.handleCreateOfferError.bind(self));
}

Happy.prototype.doAnswer = function() {
	var self = this; 

	if(!self.pc) {
		return;
	}

	// forwardTo is already set in "offer"

  	$('.remoteVideo').removeClass('hidden');
  	$('.localVideo').removeClass('hidden');
  	$('#hang-up-during-call').removeClass('hidden');
  	$('#ringing').closeModal();


	self.trace('Sending answer to peer'); 
	self.pc.createAnswer(self.setLocalAndSendMessage.bind(self), null, self.sdpConstraints);
}

Happy.prototype.setLocalAndSendMessage = function(sessionDescription) {
	var self = this; 

//	sessionDescription.sdp = self.preferOpus(sessionDescription.sdp);
	// sessionDescription.sdp = (sessionDescription.sdp);

	self.pc.setLocalDescription(sessionDescription); 

	self.trace('setLocalAndSendMessage sending message ', sessionDescription); 
	self.sendMessage({type: sessionDescription.type, data: sessionDescription});

	// self.sendMessage({room: self.room, type: 'offer', data: sessionDescription});
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

	self.trace('Remote stream added', event.stream);
	self.remoteVideo.src = window.URL.createObjectURL(event.stream); 
	self.remoteVideo.play();
	self.remoteStream = event.stream; 
}

Happy.prototype.handleRemoteStreamRemoved = function(event) {
	var self = this; 
	self.trace('Remote stream removed. Event: ', event); 
}

Happy.prototype.hangup = function() {
	var self = this; 
  	$('#ringing').closeModal();
  	$('.remoteVideo').addClass('hidden');
  	$('.localVideo').addClass('hidden');
  	$('#hang-up-during-call').addClass('hidden');


	self.trace('Hanging up'); 
	self.stop(); 
	// self.sendMessage({room: self.room, type: 'bye'});
}

Happy.prototype.handleRemoteHangup = function() {
	var self = this; 
	self.trace('Remote hangup');
}

Happy.prototype.stop = function() {
	var self = this; 

	self.isStarted = false; 
	if(self.pc) {
		self.pc.close(); 
		self.pc = null; 
	}
}

///////////////////////////////////////////////////////////////////////////

Happy.prototype.ring = function() {
	var self = this; 
  	$('#ringing').openModal();
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



Happy.prototype.trace = function(text, obj) {
	console.log((performance.now() / 1000).toFixed(3) + ": " + text, obj);
}
