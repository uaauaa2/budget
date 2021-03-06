angular.module('budget.controllers').controller("PlanCtrl", function($scope, dataService) {
    $scope.debugText = "";

    $scope.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    $scope.planTable = {}; 
    $scope.db = dataService.getDB();

    $scope.getTotal = function(tableName, month, isPlan){
        /*console.log("------------");
        if (tableName === "income") 
                console.log("month: " + month, isPlan); // 
                ////*/
        var result = $scope.db.queryAll(tableName, { 
                            query: function(row1) {
                                var d = new Date(row1.date);
                                /*if (tableName === "income") console.log(row1);*/
                                
                                if ((row1.isPlan == isPlan) && (row1.isActive) && d.getMonth() == (month-1)) {
                                        /*if (tableName === "income") 
                                            console.log("found");*/ 
                                        return true;
                                }
                                    
                                return false;
                            }
                     });
        
        /*if (tableName === "income") 
                console.log("result.length: " + result.length);*/
        var index;
        var sum = 0; 
        for (index = 0; index < result.length; index++) {
            sum += result[index].amount;
        }
        /*if (tableName === "income") 
                console.log(month + " " + sum);*/
        return sum; 
    };

    

    $scope.init = function() {
        $scope.planTable = {};
        var currentMonth = (new Date()).getMonth() + 1;
        //console.log("current: " + currentMonth);  
        for (var monthIndex = 1; monthIndex <= 12; ++monthIndex){
            var isPlan = monthIndex >= currentMonth;
            var pr = 0; 
            if (monthIndex > 1)
                pr = $scope.planTable[monthIndex-1].remaining; 
            var i = $scope.getTotal("income", monthIndex, isPlan);
            var e = $scope.getTotal("expenses", monthIndex, isPlan);
            var r = pr + i - e;  
            $scope.planTable[monthIndex] = { 
                month: monthIndex, 
                totalIncome: i, 
                totalExpenses: e, 
                isActual: !isPlan, 
                remaining: r 
            };
            //console.log(monthIndex, isPlan, i, e, r); 
        }
 
    }
    
    $scope.init(); 
    
  
    $scope.recalculate = function() {
        for (var monthIndex = 1; monthIndex <= 12; ++monthIndex){
            var pr = 0; 
            if (monthIndex > 1)
                pr = $scope.planTable[monthIndex-1].remaining;
            var i = $scope.getTotal("income", $scope.planTable[monthIndex].month, !$scope.planTable[monthIndex].isActual);
            var e = $scope.getTotal("expenses", $scope.planTable[monthIndex].month, !$scope.planTable[monthIndex].isActual);
            var r = i - e + pr; 

            $scope.planTable[monthIndex].totalIncome = i; 
            $scope.planTable[monthIndex].totalExpenses = e;
            $scope.planTable[monthIndex].remaining = r;  
        };
        
        
 
    }
  
    
  
  
  });