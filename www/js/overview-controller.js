angular.module('budget.controllers').controller('OverviewCtrl', function($scope, $http, dataService) {
    $scope.expenseItems = [];
    $scope.auth = {code: "", token: ""};  
    
    $scope.stringdb = "";
    $scope.overviewMessages = dataService.overviewMessages;
    

    $scope.init = function() {
        
            
            $scope.expenseItems = dataService.db.queryAll("expenseItems");
         
         
         
        //$scope.overviewMessages.push("init completed");
    };
    
    
    $scope.getLevel = function(expenseItem){
        return expenseItem.levelNum; 
    };
    
    $scope.getTitle = function(expenseItem){
        return expenseItem.title; 
    }
    
    $scope.getTotalByMonth = function(expenseItem, month){
        //var title = $scope.getTitle(expenseItem); 
        //var level = $scope.getLevel(expenseItem);
                
        var monthString = "" + month;
        if (monthString.length == 1)
            monthString = "0" + monthString; 
             
        var result = dataService.db.queryAll("expenses", { 
            query: function(row) {
                if (expenseItem.idListForTotal.indexOf(row.expenseItemId) >= 0 && row.date.indexOf("-" + monthString +  "-") >= 0) {
                    return true;
                } else {
                    return false;
                }
            }
        });
         
        var index;
        var sum = 0; 
        for (index = 0; index < result.length; ++index) {
            sum += result[index].amount;
        }
        return sum; 
    }
  
    $scope.getAuthToken = function(){
        dataService.getAuthToken($scope.auth.code); 
    }
    
 
  
});