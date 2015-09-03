angular.module('budget.controllers').controller('IncomeCtrl', function($scope, dataService, $http) {
    $scope.incomeIsPlan = false; 
    $scope.incomeDate = new Date();
    $scope.incomeAgent = "Костя"; 
    $scope.incomeAmount = null; 
    $scope.incomeComment = "";
    $scope.db = dataService.getDB(); 
     
    //$scope.allIncome = [{isPlan: false, date: "2015-07-01", agent: "Костя", amount: 100000, comment: ""}];
    
    $scope.init = function(){
        $scope.allIncome = $scope.db.queryAll("income");
    }
    
    $scope.init(); 
    
    
    $scope.add = function() {
        $scope.allIncome.push( {
              isPlan: $scope.incomeIsPlan,
              date: $scope.incomeDate.yyyy_mm_dd(), 
              agent: $scope.incomeAgent,
              amount: parseInt($scope.incomeAmount),
              comment: $scope.incomeComment
            }
        );  
        $scope.db.insert("income", {
                isPlan: $scope.incomeIsPlan,
                date: $scope.incomeDate.yyyy_mm_dd(), 
                agent: $scope.incomeAgent,
                amount: parseInt($scope.incomeAmount),
                comment: $scope.incomeComment
            }
        );
        $scope.db.commit();
    };
    
    $scope.del = function(b) {
        var i = $scope.allIncome.indexOf(b);
        $scope.allIncome.splice(i, 1);
        $scope.db.deleteRows("income", { ID: b.ID } );
        $scope.db.insert("localChanges", { tableName: "income", action: "delete", rowId: b.ID });
        $scope.db.commit(); 
    };
    
     
    
    
  
});