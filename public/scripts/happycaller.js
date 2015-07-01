Happy = function(options) {

	this.options = {
		server: 'http://192.168.0.16:3333',
		localVideo: $('.localVideo')[0],
		remoteVideo: $('.remoteVideo')[0]
	}

	$.extend(this.options, options);

	this.localVideo = this.options.localVideo;
	this.remoteVideo = this.options.remoteVideo;
	this.localStream; 
	this.localPeerConnection; 
	this.remotePeerConnection; 
}

Happy.prototype.addMedia = function(opts) {
	var self = this;
	var options = {
		video: true,
		audio: true
	};

	$.extend(options, opts); 

	navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	var constraints = {video: options.video, audio: options.audio};

	function successCallback(localMediaStream) {
		self.trace("Received local stream"); 
		self.localVideo.src = URL.createObjectURL(localMediaStream); 
		self.localVideo.play();
		self.localStream = localMediaStream; 
	}


	function errorCallback(error){
		self.trace("navigator.getUserMedia error: ", error);
	}

	navigator.getUserMedia(constraints, successCallback, errorCallback);

}

Happy.prototype.trace = function(text) {
	console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}


Happy.prototype.start = function() {
	var self = this;

	self.trace("Requesting local stream"); 
	self.addMedia();
}

Happy.prototype.call = function() {
	var self = this;

	self.trace("Starting call");

	console.log(self.localStream);

	if(self.localStream.getVideoTracks().length > 0) {
		self.trace('Using video device: ', self.localStream.getVideoTracks()[0].label);
	}
	if(self.localStream.getAudioTracks().length > 0) {
		self.trace('Using audio device: ', self.localStream.getAudioTracks()[0].label);
	}

	var servers = null; 
	self.localPeerConnection = new RTCPeerConnection(servers);
	self.trace('Created local peer connection object localPeerconnection');
	self.localPeerConnection.onicecadidate = self.gotLocalIceCandidate.bind(self);

	self.remotePeerConnection = new RTCPeerConnection(servers);
	self.trace("Created remote peer connection object remotePeerConnection");
	self.remotePeerConnection.onicecandidate = self.gotRemoteIceCandidate.bind(self);
	self.remotePeerConnection.onaddstream = self.gotRemoteStream.bind(self);


	self.localPeerConnection.addStream(self.localStream);
	self.trace("Added localStream to localPeerConnection");
	self.localPeerConnection.createOffer(self.gotLocalDescription.bind(self), self.handleError.bind(self));
}

Happy.prototype.hangup = function() {
	var self = this; 

	self.trace('Ending call...');
	self.localPeerConnection.close();
	self.remotePeerConnection.close();
	self.localPeerConnection = null;
	self.remotePeerConnection = null;
}

Happy.prototype.gotLocalDescription = function(description) {
	var self = this;

	self.localPeerConnection.setLocalDescription(description);
	self.trace("Offer from localPeerConnection: \n", description.sdp);
	self.remotePeerConnection.setRemoteDescription(description);
	self.remotePeerConnection.createAnswer(self.gotRemoteDescription.bind(self),self.handleError.bind(self));
}

Happy.prototype.gotRemoteDescription = function(description) {
	var self = this;

	self.remotePeerConnection.setLocalDescription(description);
	self.trace("Answer from remotePeerConnection: \n", description.sdp);
	self.localPeerConnection.setRemoteDescription(description);
}

Happy.prototype.gotRemoteStream = function(event) {
	var self = this;
	self.remoteVideo.src = URL.createObjectURL(event.stream);
	self.trace("Received remote stream");
}


Happy.prototype.gotLocalIceCandidate = function(event) {
	var self = this;

	if (event.candidate) {
		self.remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		self.trace("Local ICE candidate: \n", event.candidate.candidate);
	}
}

Happy.prototype.gotRemoteIceCandidate = function(event){
  var self = this;

	if (event.candidate) {
		self.localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		self.trace("Remote ICE candidate: \n ", event.candidate.candidate);
	}
}

Happy.prototype.handleError = function(){}