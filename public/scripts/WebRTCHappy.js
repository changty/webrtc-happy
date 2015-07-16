var app = angular.module( 'WebRTCHappy', ['ngRoute', 'ngAnimate'] );

// Routing
app.config(function($routeProvider, $locationProvider) {
	$routeProvider

		//main view
		.when('/', {
			templateUrl: 'page-main.html',
			controller: 'mainCtrl'
		})

		// chat view
		.when('/p/chat/:email', {
			templateUrl: 'page-chat.html',
			controller: 'chatCtrl'
		})

		.when('/p/addcontact', {
			templateUrl: 'page-addcontact.html',
			controller: 'addContactCtrl'
		})

		.otherwise({
			redirectTo: '/'
		});

		$locationProvider.html5Mode(true);
});

app.filter("sanitize", ['$sce', function($sce) {
  return function(htmlCode){
    return $sce.trustAsHtml(htmlCode);
  }
}]);

app.directive('contactsLoopDirective', function() {
	return function(scope, element, attrs) {
		if(scope.$last) {
			$('.collapsible').collapsible({
      			accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
    		});	
		}
	}
});