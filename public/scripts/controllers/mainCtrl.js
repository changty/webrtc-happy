app.controller("mainCtrl", function($scope, $http) {
	  $scope.hideAccount = true;
	  $scope.hideRecents = false;

	  $scope.hideErrorMsg = true;
	  $scope.hideSuccessMsg = true;
	  $scope.errormessage = ""; 
	  $scope.successmessage = "";

	  // init
	  $(".button-collapse").sideNav();

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