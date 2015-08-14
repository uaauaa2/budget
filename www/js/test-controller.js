  
angular.module('budget.controllers').controller("TestCtrl", function($scope, $http, dataService, $filter) {
    $scope.debug = { message: 'test is ok' };
    $scope.overviewMessages = dataService.overviewMessages;     
    $scope.syncStatus = dataService.syncStatus;


});