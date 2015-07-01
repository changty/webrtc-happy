Happy = function(options) {

	this.options = {
		server: 'http://192.168.0.10:3333'
	}

	$.extend(this.options, options);

}

Happy.prototype.addMedia = function(opts) {
	
	var options = {
		parent: $('.video')[0],
		video: true,
		audio: true
	};

	$.extend(options, opts); 

	navigator.getUserMedia = navigator.getUserMedia ||
	  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	var constraints = {video: options.video, audio: options.audio};

	function successCallback(localMediaStream) {
	  window.stream = localMediaStream; // stream available to console
	  var video = options.parent;
	  video.src = window.URL.createObjectURL(localMediaStream);
	  video.play();
	}

	function errorCallback(error){
	  console.log("navigator.getUserMedia error: ", error);
	}

	navigator.getUserMedia(constraints, successCallback, errorCallback);

}

Happy.prototype.addVideoOnly = function(opts) {
	var self = this; 

	var options = {
		parent: $('.video')[0]
		video: true,
		audio: false
	}

	$.extend(options, opts);

	self.addMedia(options);
}

Happy.prototype.addAudioOnly = function(opts) {
	var self = this; 

	var options = {
		parent: $('.audio')[0]
		video: false,
		audio: true
	}

	$.extend(options, opts);

	self.addMedia(options);
}