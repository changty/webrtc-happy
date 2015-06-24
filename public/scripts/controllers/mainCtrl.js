	app.controller("mainCtrl", function($scope, $http) {

	$scope.SERVER = SERVER_ADDRESS;
	$scope.hideAccount = true;
	$scope.hideRecents = false;

	$scope.hideErrorMsg = true;
	$scope.hideSuccessMsg = true;
	$scope.errormessage = ""; 
	$scope.successmessage = "";

	// init
	$(".button-collapse").sideNav();

	// start webrtc stuff
	var webrtc = new SimpleWebRTC({
		// the id/element dom element that will hold "our" video
		localVideoEl: 'localVideo',
		// the id/element dom element that will hold remote videos
		remoteVideosEl: 'remotesVideos',
		// immediately ask for camera access
		autoRequestMedia: true,
		url: $scope.SERVER,
		connection: io()
	});	

	// join without waiting for media
	webrtc.on('readyToCall', function() {
		webrtc.joinRoom('test-room');
	});

	// called when a peer is created
	webrtc.on('createdPeer', function (peer) {
		console.log('createdPeer', peer);
	});

	// a peer video has been added
	webrtc.on('videoAdded', function (video, peer) {
		console.log('video added', peer);
		var remotes = document.getElementById('remotes');
		if (remotes) {
			var container = document.createElement('div');
			container.className = 'videoContainer';
			container.id = 'container_' + webrtc.getDomId(peer);
			container.appendChild(video);

			// suppress contextmenu
			video.oncontextmenu = function () { return false; };

			remotes.appendChild(container);
		}

		// show the ice connection state
		if (peer && peer.pc) {
			var connstate = document.createElement('div');
			connstate.className = 'connectionstate';
			container.appendChild(connstate);
			peer.pc.on('iceConnectionStateChange', function (event) {
				switch (peer.pc.iceConnectionState) {
				case 'checking':
					connstate.innerText = 'Connecting to peer...';
					break;
				case 'connected':
				case 'completed': // on caller side
					connstate.innerText = 'Connection established.';
					break;
				case 'disconnected':
					connstate.innerText = 'Disconnected.';
					break;
				case 'failed':
					break;
				case 'closed':
					connstate.innerText = 'Connection closed.';
					break;
				}
			});
		}
	});

	// a peer video was removed
	webrtc.on('videoRemoved', function (video, peer) {
		console.log('video removed ', peer);
		var remotes = document.getElementById('remotes');
		var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
		if (remotes && el) {
			remotes.removeChild(el);
		}
	});


	// local p2p/ice failure
	webrtc.on('iceFailed', function (peer) {
		var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
		console.log('local fail', connstate);
		if (connstate) {
			connstate.innerText = 'Connection failed.';
			fileinput.disabled = 'disabled';
		}
	});

	// remote p2p/ice failure
	webrtc.on('connectivityError', function (peer) {
		var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
		console.log('remote fail', connstate);
		if (connstate) {
			connstate.innerText = 'Connection failed.';
			fileinput.disabled = 'disabled';
		}
	});

	// listen for mute and unmute events
	webrtc.on('mute', function (data) { // show muted symbol
		webrtc.getPeers(data.id).forEach(function (peer) {
			if (data.name == 'audio') {
				$('#videocontainer_' + webrtc.getDomId(peer) + ' .muted').show();
			} else if (data.name == 'video') {
				$('#videocontainer_' + webrtc.getDomId(peer) + ' .paused').show();
				$('#videocontainer_' + webrtc.getDomId(peer) + ' video').hide();
			}
		});
	});

	webrtc.on('unmute', function (data) { // hide muted symbol
		webrtc.getPeers(data.id).forEach(function (peer) {
			if (data.name == 'audio') {
				$('#videocontainer_' + webrtc.getDomId(peer) + ' .muted').hide();
			} else if (data.name == 'video') {
				$('#videocontainer_' + webrtc.getDomId(peer) + ' video').show();
				$('#videocontainer_' + webrtc.getDomId(peer) + ' .paused').hide();
			}
		});
	});

	//TODO:
	//local mute/unmute events
	webrtc.on('audioOn', function () {
		// your local audio just turned on
	});
	webrtc.on('audioOff', function () {
		// your local audio just turned off
	});
	webrtc.on('videoOn', function () {
		// local video just turned on
	});
	webrtc.on('videoOff', function () {
		// local video just turned off
	});


	$http.get('/api/user', {}).
		success(function(data, status, headers, config) {
			console.log("success", data);
			$scope.fname = data.fname;
			$scope.lname = data.lname;
			$scope.email = data.email; 
		}).

		error(function(data, status, headers, config) {
			console.log("error ", data);
		});


		$scope.focusSearch = function() {
			angular.element('#search').focus()
		};

		$scope.showAccount = function() {
			$scope.hideAccount = false;
			$scope.hideRecents = true;
		}

		$scope.showRecents = function() {
			$scope.hideAccount = true;
			$scope.hideRecents = false;
		}

		$scope.updateUserInfo = function(account) {
			var data = {}; 
			data.fname = $scope.fname;
			data.lname = $scope.lname; 
			data.email = $scope.email; 
		
			if(account.password != null && account.password.$valid) {
				data.password = $scope.password; 
			}

			$http.post('/api/updateuser', data). 
				success(function(data, status, headers, config) {
					console.log("success");
					$scope.setSuccess("Changes were saved"); 
				}).
				error(function(data, status, headers, config) {
					console.log("error"); 
					if(data === 'email in use') {
						$scope.setError("Email is already in use");
					}
					else {
						$scope.setError("Something went wrong :(");
					}
				});
		}

	$scope.setSuccess = function(success) {;
		$scope.successmessage = success;
		$scope.hideSuccessMsg = false;
		$scope.hideErrorMsg = true;
	};


	$scope.setError = function(error) {
		$scope.errormessage = error;
		$scope.hideSuccessMsg = true;
		$scope.hideErrorMsg = false;
	};
});