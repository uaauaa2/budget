  
angular.module('budget.controllers').controller("HeaderCtrl", function($scope, $http, dataService, $timeout) {
    $scope.syncStatus = dataService.getSyncStatus();
    //$scope.debug = { message: "test" }; 
    $scope.i = 0; 
    
    /*$scope.syncTimer = $timeout(function tick(){
        $scope.syncStatus = dataService.getSyncStatus();
        
        $scope.syncTimer = $timeout(tick, 3000); 
    }, 3000); 

     
    
    $scope.clearSyncTimeout = function(){
        $timeout.cancel($scope.syncTimer);
        alert("stopped");
    }
    
    $scope.sync = function(){
        $scope.syncStatus.status = 1;
        dataService.sync();
    }*/

});

