
angular.module('budget.controllers').controller("TestCtrl", function($scope, $http, dataService, $filter) {
    //$scope.debug = { message: dataService.getDB() }; //.queryAll("expenseItems").length
    $scope.overviewMessages = dataService.overviewMessages;     
    
    
    $scope.test = function(){
        //clearTimeout($scope.syncTimer);
        alert(JSON.stringify(dataService.db));
    }
    

});