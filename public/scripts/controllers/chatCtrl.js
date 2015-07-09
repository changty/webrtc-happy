app.controller("chatCtrl", function($scope, $http, $routeParams, $rootScope) {
	$scope.pageClass = 'page-chat';
	$scope.user = $routeParams.email;


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


			$scope.to = getUserByEmail($scope.user);
			//initialize happy
			//$rootScope.happy = new Happy({defaultRoom: $scope.happy_addr}); 
		}).

		error(function(data, status, headers, config) {
			console.log("error ", data);
		});



	function getUserByEmail(email) {
		for(var i=0; i<$rootScope.contacts.length; i++) {
			if($rootScope.contacts[i].email === email) {
				return $rootScope.contacts[i]; 
			}
		}
	}
			
});