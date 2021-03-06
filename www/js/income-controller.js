angular.module('budget.controllers').controller('IncomeCtrl', function($scope, dataService, $http) {
    $scope.incomeIsPlan = false; 
    $scope.incomeDate = new Date();
    $scope.incomeAgent = "Я"; 
    $scope.incomeAmount = null; 
    $scope.incomeComment = "";
    $scope.db = dataService.getDB(); 
     
    
    $scope.init = function(){
        $scope.allIncome = $scope.db.queryAll("income", { query: { isActive: true } });
    }
    
    $scope.init(); 
    
    
    $scope.add = function() {
        var operationDate = (new Date()).formatFull();
        
        if ($scope.incomeIsPlan === "true")
            $scope.incomeIsPlan = true;
        if ($scope.incomeIsPlan === "false")
            $scope.incomeIsPlan = false;    
        
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
                comment: $scope.incomeComment,
                changeDate: operationDate,  
                isActive: true
            }
        );
        $scope.db.commit();
    };
    
    $scope.del = function(b) {
        var operationDate = (new Date()).formatFull();
        var i = $scope.allIncome.indexOf(b);
        $scope.allIncome.splice(i, 1);
        $scope.db.update("income", {ID: b.ID}, 
                    function(row) {
                        row.isActive = false;
                        row.changeDate = operationDate;
                        return row;
                    }
                );
        
        $scope.db.commit(); 
    };
    
     
    
    
  
});