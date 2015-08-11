angular.module('budget.controllers').controller("ExpensesCtrl", function($scope, $http, dataService, $filter) {
    $scope.debugText = "";

    $scope.month = 8; 
    $scope.expensesTable = [];  
    $scope.queryFn = null;
    
      
    
    
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
             
        var result = dataService.db.queryAll("expenses", { 
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
             
        var result = dataService.db.queryAll("expenses", { 
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
        //$scope.debugText = JSON.stringify($scope.expensesTable); 
    };
    
    $scope.baseInit = function(){
        if (dataService.db == null){
            dataService.db = new localStorageDB(dataService.dbName, localStorage);
        } 
         
    }

    $scope.init = function() {
        $scope.baseInit(); 
        $scope.allExpenseItems = dataService.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
        $scope.expenseItems = dataService.db.queryAll("expenseItems", { 
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
        //$scope.updateExpensesTable(); 
        //$scope.newExpenseDate = new Date();
        $scope.expenses = [{ date: new Date(), expenseItemId: $scope.defaultExpenseItemId, comment: "" }]; //, amount: 0, 
    };
    
    $scope.init(); 
    
    $scope.addAllExpenses = function() {
        //$scope.debugText = $scope.expenses[0].date.toISOString().substr(0, 10); //JSON.stringify($scope.expenses);
        if ($scope.queryFn != null){
            var list = dataService.db.queryAll("expenses", { query: $scope.queryFn });
            for (var key in list)
                dataService.db.insert("localChanges", { tableName: "expenses", action: "delete", rowId: list[key].ID }); 
        
            dataService.db.deleteRows("expenses", $scope.queryFn );
            $scope.queryFn = null;
        }
        
        for (var key in $scope.expenses){
            dataService.db.insert("expenses", {
                isPlan: false, 
                date: $scope.expenses[key].date.toISOString().substr(0, 10),
                expenseItemId: $scope.expenses[key].expenseItemId, 
                amount: parseInt($scope.expenses[key].amount), 
                comment: $scope.expenses[key].comment 
            });
        }
        
        dataService.db.commit(); 
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
        
        
        var list = dataService.db.queryAll("expenses", { query: $scope.queryFn });

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
  
    $scope.uploadDB = function(){
        var revision = "0";  
        var tokenRes = dataService.db.queryAll("authToken"); 
        var authToken = "";    
        if (tokenRes.length > 0){
                authToken = tokenRes[0].token;
        }
        if (authToken != ""){   
            $http({
                method: 'PUT',
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/",
                headers: { "Authorization": authToken }  
            }).success(function(response) {
            	//$scope.overviewMessages.push("success: " + JSON.stringify(response));
                revision = response.revision;
                var delta = {
                        "delta_id": "db update",
                        "changes": [{
                                "change_type": "set", 
                                "collection_id": "budget", 
                                "record_id": "2015",  
                                "changes": [{
                                        "change_type": "set", 
                                        "field_id": "data", 
                                        "value": {
                                            "type": "string",
                                            "string": dataService.db.serialize(),
                                        }
                                }]
                        }] 
                };
                //alert($scope.db.serialize());
                //alert(JSON.stringify(delta)); 
                $http({
                    method: "POST",
                    url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/deltas/",
                    data: delta,  
                    headers: { "Authorization": authToken, "If-Match": revision }
                }).success(function(response) {
                    alert("uploaded")
                }).error($scope.errorHandler);
                 
            }).error($scope.errorHandler);
        }
        else 
            alert("authToken missing"); 
        
    } 

  
  
    
  
  
  });