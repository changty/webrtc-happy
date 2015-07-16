app.controller("mainCtrl", function($scope, $http, $rootScope) {
	$scope.pageClass = 'page-main';

	$scope.hideErrorMsg = true;
	$scope.hideSuccessMsg = true;
	$scope.errormessage = ""; 
	$scope.successmessage = "";


	$scope.$on('$routeChangeSuccess', function () {
		$('.tabs').tabs();
	    $(".menu").sideNav();
	    $('.collapsible').collapsible({
     		 accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
    	});

	});

	// Get user info
	$http.get('/api/user', {}).
		success(function(data, status, headers, config) {
			console.log("success", data);
			$scope.fname = data.fname;
			$scope.lname = data.lname;
			$scope.email = data.email; 
			$scope.happy_addr = data.happy_addr;
			$scope.contacts = data.contacts;
			$rootScope.contacts = data.contacts;

			// initialize happy
			$rootScope.happy = new Happy({defaultRoom: $scope.happy_addr}); 
		}).

		error(function(data, status, headers, config) {
			console.log("error ", data);
		});


	$scope.call = function(email) {
		$rootScope.happy.doCall(getHappyAddrByEmail(email)); 
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

	$scope.setSuccess = function(success) {
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