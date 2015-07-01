app.controller("loginCtrl", function($scope, $http) {

	$scope.hideLogin = false;
	$scope.hideForgotPassword = true;
	$scope.hideNewUser = true;

	$scope.hideErrorMsg = true; 
	$scope.hideSuccessMsg = true;


	$scope.showForgot = function() {
		$scope.hideErrorMsg = true; 
		$scope.hideSuccessMsg = true; 
		$scope.hideLogin = true; 
		$scope.hideNewUser = true;
		$scope.hideForgotPassword = false;
	}

	$scope.showNew = function() {
		$scope.hideErrorMsg = true; 
		$scope.hideSuccessMsg = true; 
		
		$scope.hideLogin = true; 
		$scope.hideForgotPassword = true;
		$scope.hideNewUser = false;
	}

	$scope.showLogin = function() {
		$scope.hideErrorMsg = true; 
		$scope.hideSuccessMsg = true; 
		$scope.hideLogin = false; 
		$scope.hideForgotPassword = true; 
		$scope.hideNewUser = true;
	}
	

	$scope.submitNewUser = function(form) {
		$http.post('/api/newuser', {fname:$scope.newUser.fname, lname: $scope.newUser.lname, email: $scope.newUser.email, password: $scope.newUser.password}).
		  success(function(data, status, headers, config) {
		  		$scope.setSuccess("Registration done!");
		  }).
		  error(function(data, status, headers, config) {
		  		console.log("data: " , data, "status: ", status, "headers: " , headers, "config: ", config); 
		    	if(data && data.emailInUse && data.emailInUse === true) {
		    		$scope.setError("Email address is already in use");
		    	}
		    	else {
		    		$scope.setError("Something went wrong :(");
		    	}
		  });
	};

	$scope.forgotSubmit = function(form) {
		$http.post('/api/forgot', {forgot: $scope.forgotPw.email}).
			success(function(data, status, headers, config) {
				console.log(data);
				$scope.setSuccess('Check your inbox for further instructions.');
			}).
			error(function(data, status, headers, config) {
				console.log(data);
				$scope.setError('Could not reset password. Check your email address.');
			});
	};


	$scope.resetPassword = function(form) {
		var password = $scope.reset.password; 
		var uuid = window.location.pathname.split('/').pop(); 

		console.log(password, uuid); 

		$http.post('/api/reset', {password: password, uuid: uuid }).
			success(function(data, status, headers,config) {
				console.log("success");
				$scope.setSuccess('Password changed, please <a href="/">login</a>.');
			}).
			error(function(data, status, headers, config) {
				console.log("epic failure");
				$scope.setError('Could not reset password. Please try again.');
			});
	};

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