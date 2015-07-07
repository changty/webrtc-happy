var app = angular.module( 'WebRTCHappy', [] );
var SERVER_ADDRESS = "http://192.168.0.10:3333";
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