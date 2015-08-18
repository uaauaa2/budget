Date.prototype.yyyy_mm_dd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding
};
  
angular.module('budget.controllers').controller("ExpensesCtrl", function($scope, $http, dataService, $filter) {
    $scope.debugText = "";

    $scope.month = 8; 
    $scope.expensesTable = [];  
    $scope.queryFn = null;
    
    $scope.db = null; //dataService.getDB(); 
    
    
    $scope.expenseItems = {};
    $scope.allExpenseItems = {};
    $scope.defaultExpenseItemId = null;
    $scope.expenses = [];  

    
    $scope.getTotalByDay = function(expenseItem, month, day){
        var monthString = "" + month;
        if (monthString.length == 1)
            monthString = "0" + monthString; 
        var dayString = "" + day;
        if (dayString.length == 1)
            dayString = "0" + dayString;
             
        var result = $scope.db.queryAll("expenses", { 
            query: function(row) {
                if (row.isPlan == false && expenseItem.idListForTotal.indexOf(row.expenseItemId) >= 0 
                    && row.date.indexOf("-" + monthString +  "-" + dayString) >= 0) {
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
        if (sum == 0)
            return "";
            
        return sum; 
    }
    
    $scope.getTotalByMonth = function(expenseItem, month){
        //var title = $scope.getTitle(expenseItem); 
                
        var monthString = "" + month;
        if (monthString.length == 1)
            monthString = "0" + monthString; 
             
        var result = $scope.db.queryAll("expenses", { 
                            query: function(row) {
                                if (row.isPlan == false 
                                    && expenseItem.idListForTotal.indexOf(row.expenseItemId) >= 0 
                                    && row.date.indexOf("-" + monthString + "-") >= 0) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                     });
        $scope.debugText = JSON.stringify(result);
        var index;
        var sum = 0; 
        for (index = 0; index < result.length; ++index) {
            sum += result[index].amount;
        }
        return sum; 
    };
    
    $scope.updateExpensesTable = function(){
        $scope.expensesTable = []; 
        for (var expIndex in $scope.allExpenseItems){
            var e = $scope.allExpenseItems[expIndex]; 
            var oByDay = []; 
            for (var i = 1; i <= 31; i++){
                oByDay[i] = $scope.getTotalByDay(e, $scope.month, i); 
            }
            
            var o = {expenseItemId:  e.ID, values: {totalSpent: $scope.getTotalByMonth(e, $scope.month), spentByDay: oByDay} }; 
            $scope.expensesTable.push(o); 
        }
    };
    
    $scope.init = function() {
        alert(dataService.getSyncStatus()) 
        $scope.db = dataService.getDB();
        $scope.allExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
        $scope.expenseItems = $scope.db.queryAll("expenseItems", { 
            query: function(row) {
                var res = false;
                if (row.name != null){
                    res = true;
                }
                return res; 
            }, 
            sort: [["orderNum", "ASC"]]
        });
        $scope.defaultExpenseItemId = $scope.expenseItems[0].ID;   
        $scope.expenses = [{ date: new Date(), expenseItemId: $scope.defaultExpenseItemId, comment: "" }]; //, amount: 0, 
    };
    
    $scope.init(); 
    
    $scope.addAllExpenses = function() {
        if ($scope.queryFn != null){
            var list = $scope.db.queryAll("expenses", { query: $scope.queryFn });
            for (var key in list)
                $scope.db.insert("localChanges", { tableName: "expenses", action: "delete", rowId: list[key].ID }); 
        
            $scope.db.deleteRows("expenses", $scope.queryFn );
            $scope.queryFn = null;
        }
        
        for (var key in $scope.expenses){
            $scope.db.insert("expenses", {
                isPlan: false, 
                date: $scope.expenses[key].date.yyyy_mm_dd(),
                expenseItemId: $scope.expenses[key].expenseItemId, 
                amount: parseInt($scope.expenses[key].amount), 
                comment: $scope.expenses[key].comment 
            });
        }
        
        $scope.db.commit(); 
        $scope.expenses = [{ date: new Date(), expenseItemId: $scope.defaultExpenseItemId, comment: "" }]; //amount: 0, 
         
    };
    
    $scope.addAnotherExpense = function() {
        var o = { date: new Date(), expenseItemId: $scope.defaultExpenseItemId, comment: "" }; //amount: 0,  
        var size = $scope.expenses.length; 
        if (size > 0 ){
            o = { date: $scope.expenses[size-1].date, expenseItemId: $scope.expenses[size-1].expenseItemId, comment: "" }; //amount: 0,   
        }
        $scope.expenses.push(o);
    }; 
    
    $scope.getTotalAmountToSubmit = function(){
        var sum = 0;
        for (var key in $scope.expenses){
            var v = parseInt($scope.expenses[key].amount);
            //console.log(v); 
            if (!isNaN(v)) 
                sum += v; 
        };
         
        return sum; 
    };
    
    $scope.keyHandle = function($event){
        //$scope.debugText = $event.which; 
        if ($event.which === 13){ 
            $scope.addAnotherExpense(); 
        };
        
    };
    
    $scope.deleteRow = function(e){
        var i = $scope.expenses.indexOf(e);
        $scope.expenses.splice(i, 1);  
    }; 
    
      
    
    $scope.listExpensesByDay = function(day){
        var monthString = "" + $scope.month;
        if (monthString.length == 1)
            monthString = "0" + monthString; 
        var dayString = "" + day;
        if (dayString.length == 1)
            dayString = "0" + dayString;
        
        
        $scope.queryFn = function(row) {
                if (row.isPlan == false 
                    && row.date.indexOf("-" + monthString +  "-" + dayString) >= 0) {
                    return true;
                } else {
                    return false;
                }
            };  
        
        
        var list = $scope.db.queryAll("expenses", { query: $scope.queryFn });

        $scope.expenses = []; 
        for (var key in list){
            $scope.expenses.push({ date: new Date(list[key].date), expenseItemId: list[key].expenseItemId, 
                amount: list[key].amount, comment: list[key].comment });
        };        
        
                   
        
        //$scope.updateDebugExpenses();   
    };
    
    
    
    $scope.getTableValueTotal = function(expenseId){
        var res = "";
        var found = ($filter('filter')($scope.expensesTable, {expenseItemId: expenseId}, true));
        
        if (found.length){
            res = found[0].values.totalSpent; 
        }
        return res; 
    }; 
    $scope.getTableValueByDay = function(expenseId, day){
        var res = "";
        var found = ($filter('filter')($scope.expensesTable, {expenseItemId: expenseId}, true));
        
        if (found.length){
            res = found[0].values.spentByDay[day]; 
        }
        return res; 
    };
  
     

  
  
    
  
  
  });