Happy = function(options) {
	var self = this; 

	this.options = {
		server: 'http://192.168.0.16:3333',
		myAddress: "my-default-room" 
	}

	$.extend(this.options, options);

	this.localStream; 
	this.remoteStream;

	// this.isChannelReady = false; 
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

	// ringing screen
	this.ring = ''+
	'<div class="ring hidden">'
		+'<video class="localVideo" id="localVideo"></video>'
		+'<video class="remoteVideo" id="remoteVideos"></video>'

		+'<div class="call-status">'
		+'<h2 class="white-text">Calling...</h2>'
		+'</div>'

		+'<div class="call-buttons">'
			+'<a id="answer" class="btn-ring btn-floating btn-large waves effect waves-light green"><i class="material-icons">call</i></a>'
			+'<a id="hang-up" class="btn-ring btn-floating btn-large waves-effect waves-light red"><i class="material-icons">call_end</i></a>'
		+'</div>'
	+'</div>';

	$('body').append(self.ring);

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

			if(!self.isStarted) {
				self.maybeStart(); 
				self.pc.setRemoteDescription(new RTCSessionDescription(message.data));
			}

			self.showRingingScreen();
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
		else if(message.type === 'hangup' && self.isStarted) {
			self.handleRemoteHangup();
		}
		else {
			self.trace(' >>>> Other message: ', message);
		}
	});

	self.init();


	// listen for answer or hangup
	$('body').on('click', '#answer', function() {
		self.doAnswer();
	});

	$('body').on('click', '#hang-up', function() {
		self.hangup();
	});

}


Happy.prototype.init = function() {
	var self = this; 


	// var constraints = {video: true, audio:true}; 
	// getUserMedia(constraints, self.handleUserMedia.bind(self), self.handleUserMediaError.bind(self));

	var constraints = {video: true, audio:true}; 
	getUserMedia(constraints, 
		function(stream) {
			self.trace('Asking permission');
			self.localStream = stream;
		}, 
		function(err){self.trace('Error: ', err);}
		);
	
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

	self.localStream = stream;
	self.localVideo = $('.localVideo')[0];
	self.localVideo.src = window.URL.createObjectURL(stream); 
	self.localVideo.addEventListener('canplay', function() {
		self.localVideo.play();
	});
	
	self.sendMessage({type: 'got user media'}); 
	if(!self.isStarted) {
		self.maybeStart();
	}

}

Happy.prototype.playUserMedia = function() {
	var self = this;

	var constraints = {video: true, audio:true}; 
	getUserMedia(constraints, self.handleUserMedia.bind(self), self.handleUserMediaError.bind(self));

	self.trace('Starting video and audio stream');
	self.trace('Showing local stream'); 
	// self.localStream = stream; 
}

Happy.prototype.handleUserMediaError = function(error) {
	var self = this; 

	self.trace('getUserMedia error: ', error);
}


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
		self.trace('Something is missing...', !self.isStarted + " " + self.localStream + " " + self.isChannelReady);
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

	self.showRingingScreen(true);

	self.playUserMedia();

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

	$('.call-status').html('<h2 class="white-text">Connected</h2>');
	self.trace('Sending answer to peer'); 
	self.pc.createAnswer(self.setLocalAndSendMessage.bind(self), null, self.sdpConstraints);
	// hide answer button
	$('#answer').addClass('hidden');
}

Happy.prototype.showRingingScreen = function(isCalling) {
	var self = this; 

	$('.ring').removeClass('hidden');

	if(isCalling) {
		$('.call-status').html('<h2 class="white-text">Calling...</h2>');
		// hide answer button
		$('#answer').addClass('hidden');
	}
	else {
		$('.call-status').html('<h2 class="white-text">Connected...</h2>');
	}

}

Happy.prototype.hideRingingScreen = function() {
	var self = this;
	$('#answer').removeClass('hidden');
  	$('.ring').addClass('hidden');
}

Happy.prototype.setLocalAndSendMessage = function(sessionDescription) {
	var self = this; 

	// sessionDescription.sdp = self.preferOpus(sessionDescription.sdp);
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
	self.remoteVideo = $('.remoteVideo')[0]
	self.remoteVideo.src = window.URL.createObjectURL(event.stream); 
	self.remoteStream = event.stream; 

	self.remoteVideo.addEventListener('canplay', function() {
		self.remoteVideo.play();
	});
}

Happy.prototype.handleRemoteStreamRemoved = function(event) {
	var self = this; 
	self.trace('Remote stream removed. Event: ', event); 
}

Happy.prototype.hangup = function() {
	var self = this; 


	self.localVideo = $('.localVideo')[0];
	self.remoteVideo = $('.remoteVideo')[0];

  	if(self.localVideo) {
	  	self.localVideo.pause();
	  	self.localVideo.src = null;
  	}
  	if(self.remoteVideo) {
	  	self.remoteVideo.pause();
	  	self.remoteVideo.src = null; 
  	}

	self.hideRingingScreen();

  	// self.localStream = null;

	self.trace('Hanging up'); 
	self.stop(); 
	// self.sendMessage({room: self.room, type: 'bye'});
}

Happy.prototype.handleRemoteHangup = function() {
	var self = this; 
	self.trace('Remote hangup');
	self.hangup();
}

Happy.prototype.stop = function() {
	var self = this; 

	self.isStarted = false; 
	if(self.pc) {
		self.pc.close(); 
		self.pc = null; 
	}

	self.sendMessage({type: 'hangup'});

}


///////////////////////////////////////////////////////////////////////////
// Set Opus as the default audio codec if it's present.
Happy.prototype.preferOpus = function(sdp) {
	var self = this;
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = self.extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = self.setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = self.removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

Happy.prototype.extractSdp = function(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
Happy.prototype.setDefaultCodec = function(mLine, payload) {
	var self = this;
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
Happy.prototype.removeCN = function(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = self.extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}



Happy.prototype.trace = function(text, obj) {
	console.log((performance.now() / 1000).toFixed(3) + ": " + text, obj);
}
