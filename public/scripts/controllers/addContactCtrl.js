app.controller("addContactCtrl", function($scope, $http, $routeParams, $rootScope) {
	$scope.pageClass = 'page-addcontact';

	$scope.$on('$routeChangeSuccess', function () {
		$('#search').focus();
	});

			
});