  
angular.module('budget.controllers').controller("SelectExpenseItemCtrl", function($scope, $http, dataService, $ionicHistory) {
    $scope.debug = { message: 'test is ok' };     
    
    $scope.expenseItems = dataService.getExpenseItems();
    
    $scope.selectItem = function(ei){
        if (ei.name){
            dataService.setActiveExpenseItem(ei);
            $ionicHistory.goBack();
        }
    }
    

});