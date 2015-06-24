var app = angular.module( 'WebRTCHappy', [] );
var SERVER_ADDRESS = "http://192.168.0.10:3333";
app.filter("sanitize", ['$sce', function($sce) {
  return function(htmlCode){
    return $sce.trustAsHtml(htmlCode);
  }
}]);