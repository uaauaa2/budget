angular.module('budget.controllers').controller('BalanceCtrl', function($scope, dataService) {
    $scope.balanceDate = new Date(); 
    $scope.totalAvailableToDate = 0; 
    //$scope.totalIncomeToDate = 1000000; 
    //$scope.totalSpentToDate = 900000;
    $scope.allBalances = []; //[{ date: "2015-07-01", totalAvailableToDate: 80000 }];
    $scope.db = dataService.getDB();  
    
    $scope.getTotalToDate = function(tableName, date){
        var balanceDate = new Date(date); 
             
        var result = $scope.db.queryAll(tableName, { 
            query: function(row) {
                var rowDate = new Date(row.date); 
                if (rowDate <= balanceDate && row.isPlan == false && row.isActive) {
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
    
    $scope.init = function(){
        $scope.allBalances = $scope.db.queryAll("balance", { query: { isActive: true } });
        //alert($scope.allBalances.length);
        var i = 0; 
        for (i = 0; i < $scope.allBalances.length; i++){
            $scope.allBalances[i].totalIncomeToDate = $scope.getTotalToDate("income", $scope.allBalances[i].date);
            $scope.allBalances[i].totalSpentToDate = $scope.getTotalToDate("expenses", $scope.allBalances[i].date);
            $scope.allBalances[i].diff = $scope.allBalances[i].totalIncomeToDate 
                - $scope.allBalances[i].totalSpentToDate - $scope.allBalances[i].totalAvailableToDate;  
        }
    }
    
    $scope.init(); 
    
    $scope.getDiff = function() {
        return $scope.getTotalIncomeToDate() - $scope.getTotalSpentToDate() - $scope.totalAvailableToDate;
    };
    
    
    
    $scope.getTotalIncomeToDate = function() {
        return $scope.getTotalToDate("income", $scope.balanceDate); 
    };
    
    $scope.getTotalSpentToDate = function() {
        return $scope.getTotalToDate("expenses", $scope.balanceDate);
    };

    
    
    $scope.add = function() {
        var a = parseInt($scope.totalAvailableToDate); 
        var i = $scope.getTotalToDate("income", $scope.balanceDate); 
        var e = $scope.getTotalToDate("expenses", $scope.balanceDate); 
        var d = i - a - e; 
        $scope.allBalances.push(
            { date: $scope.balanceDate.yyyy_mm_dd(),
              totalAvailableToDate: a,
              totalIncomeToDate: i, 
              totalSpentToDate: e,  
              diff: d
            }
        );  
        
        var operationDate = (new Date()).formatFull();
        $scope.db.insert("balance", {
                date: $scope.balanceDate.yyyy_mm_dd(),
                totalAvailableToDate: a,
                changeDate: operationDate,  
                isActive: true
            }
        );
        $scope.db.commit();
    };
    
    $scope.del = function(b) {
        var i = $scope.allBalances.indexOf(b);
        $scope.allBalances.splice(i, 1);
        var operationDate = (new Date()).formatFull();
        $scope.db.update("balance", {ID: b.ID}, 
                    function(row) {
                        row.isActive = false;
                        row.changeDate = operationDate;
                        return row;
                    }
                );
        $scope.db.commit(); 
    };
    
    
  
});