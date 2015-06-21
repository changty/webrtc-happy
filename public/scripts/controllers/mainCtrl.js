app.controller("mainCtrl", function($scope, $http) {
	  $(".button-collapse").sideNav();

	  $http.get('/api/user', {}).
	  	success(function(data, status, headers, config) {
	  		console.log("success", data);
	  		$scope.fname = data.fname;
	  		$scope.lname = data.lname;
	  	}).

	  	error(function(data, status, headers, config) {
	  		console.log("error ", data);
	  	});
});