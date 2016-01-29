angular.module('budget.controllers').controller("ExpensesPlanCtrl", function($scope, $http, dataService, $filter) {
    $scope.debugText = "";

    $scope.activeMonth = 0;
    $scope.year = (new Date()).getFullYear(); 
    $scope.isForecastVisible = false; 
    $scope.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    $scope.expensesPlanTable = {"8":{"3":{"actual":15345,"forecast":40000}}}; 
    
    $scope.allExpenseItems = {};
    $scope.db = dataService.getDB(); 

    $scope.getTotalExpenses = function(expenseItem, month, isPlan){
        var result = $scope.db.queryAll("expenses", { 
                            query: function(row) {
                                var d = new Date(row.date); 
                                if (row.isPlan == isPlan 
                                    && row.isActive == true
                                    && expenseItem.idListForTotal
                                    && expenseItem.idListForTotal.indexOf(row.expenseItemId) >= 0
                                    && d.getMonth() == month-1
                                    && d.getFullYear() == $scope.year) {
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
    };
    
    $scope.updateExpensesPlanTable = function(){
        $scope.expensesPlanTable = [];
         
        $scope.months.forEach(function(month) {
            var oMonth = {}; 
            $scope.allExpenseItems.forEach(function(expenseItem) {
                //if (expenseItem.name)
                {
                    var actual =  $scope.getTotalExpenses(expenseItem, month, false); 
                    var forecast = $scope.getTotalExpenses(expenseItem, month, true);
                    oMonth[expenseItem.ID] = { actual: actual, forecast: forecast };
                } 
            }, this);
            $scope.expensesPlanTable[month] = oMonth; 
        }, this); 
    };

    $scope.init = function() {
        $scope.allExpenseItems = $scope.db.queryAll("expenseItems", { query: { isActive: true }, sort: [["orderNum", "ASC"]] });
        $scope.updateExpensesPlanTable(); 
    };
    
    $scope.init(); 
    
    $scope.saveExpensesPlanTable = function(){
        var l = 0; 
        var operationDate = (new Date()).formatFull();
        for (var month = 1; month <= 12; ++month){ //$scope.expensesPlanTable.forEach(function(monthObj)
            var monthString = "" + month;
            if (monthString.length == 1)
                monthString = "0" + monthString;
            var dateString = $scope.year + "-" + monthString + "-01"; 
            
            var monthObj = $scope.expensesPlanTable[month]; 
            for (var expenseItemId in monthObj){ //monthObj.forEach(function(expenseItemObj)
                var a = parseInt(monthObj[expenseItemId].forecast);
                if (a != 0){
                    var r = $scope.db.queryAll("expenseItems", { query: {ID: expenseItemId }}); 
                    var nm = r[0].name;
                    // insert to db
                    if (nm){ // it means that the expenseItem is not for summarizing only 
                        $scope.db.insertOrUpdate("expenses", 
                            { // search criteria
                                isPlan: true, 
                                date: dateString,
                                expenseItemId: expenseItemId
                            }, 
                            { // data to insert
                                isPlan: true, 
                                date: dateString,
                                expenseItemId: expenseItemId,
                                amount: a, 
                                comment: "",
                                changeDate: operationDate,  
                                isActive: true
                            } 
                        );
                        l++; 
                    }
                }
            };
            
        };
        console.log("expensesPlan: inserted rows: " + l);
        $scope.db.commit();
    };
    
    
    $scope.getTotalForChildren = function(idList, month){
        var sum = 0;
        idList.forEach(function(element) {
            if ($scope.expensesPlanTable[month] && $scope.expensesPlanTable[month][element])
                sum += parseInt($scope.expensesPlanTable[month][element].forecast); 
        }, this);
        
        return sum; 
    }  
    
     

  
  
    
  
  
  });