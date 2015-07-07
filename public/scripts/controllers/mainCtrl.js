app.controller("mainCtrl", function($scope, $http) {

	$scope.SERVER = SERVER_ADDRESS;
	$scope.hideAccount = true;
	$scope.hideRecents = false;

	$scope.hideErrorMsg = true;
	$scope.hideSuccessMsg = true;
	$scope.errormessage = ""; 
	$scope.successmessage = "";

	// UI init
	$(".button-collapse").sideNav();

	// Get user info
	$http.get('/api/user', {}).
		success(function(data, status, headers, config) {
			console.log("success", data);
			$scope.fname = data.fname;
			$scope.lname = data.lname;
			$scope.email = data.email; 
			$scope.happy_addr = data.happy_addr;
			$scope.contacts = data.contacts;

			// initialize happy
			$scope.happy = new Happy({defaultRoom: $scope.happy_addr}); 
		}).

		error(function(data, status, headers, config) {
			console.log("error ", data);
		});


	// $scope.start = function() {
	// 	happy.maybeStart();
	// }

	$scope.call = function(email) {
		$scope.happy.doCall(getHappyAddrByEmail(email)); 
	}

	$scope.answer = function() {
		$scope.happy.doAnswer();
	}

	$scope.hangup = function() {
		$scope.happy.hangup();
	}

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


		// Calling stuff, just prototyping and testing here


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


	function getHappyAddrByEmail(email) {
		for(var i=0; i<$scope.contacts.length; i++) {
			if($scope.contacts[i].email === email) {
				return $scope.contacts[i].happy_addr; 
			}
		}
	}
});