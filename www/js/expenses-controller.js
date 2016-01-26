angular.module('budget.controllers').controller("ExpensesCtrl", function($scope, $http, dataService, $filter, $timeout) {
    $scope.debugText = "";

    $scope.month = 1; 
    $scope.expensesTable = [];  
    $scope.queryFn = null;
    $scope.newExpense = null; 
    
    //$scope.db = null;
    $scope.db = dataService.getDB(); 
      
    
    $scope.expenseItems = {};
    $scope.allExpenseItems = {};
    $scope.defaultExpenseItemId = null;
    $scope.expenses = [];  
    $scope.newExpenses = [];
    $scope.activeExpenseItem = null; 
    $scope.listToEdit = []; 

    
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
                    && row.date.indexOf("-" + monthString +  "-" + dayString) >= 0
                    && row.isActive == true) {
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
    
    $scope.$watch('activeExpenseItem', function(newVal, oldVal){
        $scope.newExpense.expenseItemId = $scope.activeExpenseItem.ID; 
    }, true);
    
    $scope.init = function() {
        //$scope.db = dataService.getDB();
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
        $scope.newExpenses = [];
        $scope.newExpense = { date: new Date(), expenseItemId: dataService.getActiveExpenseItem().ID, comment: "" };
        $scope.activeExpenseItem = dataService.getActiveExpenseItem();    
    };
    
    $scope.init(); 
    
    /*$scope.findDeleted = function(list1, list2){
        var deletedItems = [];
        if (list1) {
            deletedItems = list1.filter(
                function(list1Item){ 
                    return !list2.some(
                        function(list2Item){
                            return list1Item.ID == list2Item.ID;  
                        })
                    }
            );
        }
        return deletedItems; 
    }*/
    
    $scope.findNewOrUpdated = function(list1, list2, isEqualFn){
        var changedItems = list2.filter(
            function(list2Item){ // должна вернуть true, если list2Item нет в list1
                return !list1.some( // проверяем list1 на наличие
                    function(list1Item){
                        return isEqualFn(list1Item, list2Item); 
                    }
                )
            }
        );
        return changedItems; 
    }
    
    $scope.findDeleted = function(list1, list2){
        return $scope.findNewOrUpdated(list2, list1, 
            function(item1, item2){
                return item1.ID == item2.ID;
            }
        );
    }
    
    $scope.addAllExpenses = function() {
        /*if ($scope.queryFn != null){
            var list = $scope.db.queryAll("expenses", { query: $scope.queryFn });
            for (var key in list)
                $scope.db.insert("localChanges", { tableName: "expenses", action: "delete", rowId: list[key].ID }); 
        
            $scope.db.deleteRows("expenses", $scope.queryFn );
            $scope.queryFn = null;
        }*/
        
        var operationDate = (new Date()).formatFull();
        var deletedItems = $scope.findDeleted($scope.listToEdit, $scope.expenses);
        //console.log(JSON.stringify(deletedItems));
        //throw "test deleted"
        deletedItems.forEach(
            function(item){
                $scope.db.update("expenses", {ID: item.ID}, 
                    function(row) {
                        row.isActive = false;
                        row.changeDate = operationDate;
                        console.log("to mark as deleted, amount: " + row.amount); 
                        return row;
                    }
                );
            }
        ); 
        
        
        var newOrUpdatedItems = $scope.findNewOrUpdated($scope.listToEdit, $scope.expenses, 
            function(item1, item2) {
                var res2 = 
                    item1.ID == item2.ID && 
                    item1.isPlan == item2.isPlan && 
                    item1.date == item2.date.yyyy_mm_dd() && 
                    item1.expenseItemId == item2.expenseItemId &&  
                    item1.amount == item2.amount && 
                    item1.comment == item2.comment && 
                    item1.changeDate == item2.changeDate &&  
                    item1.isActive == item2.isActive;  
                return res2;
            }
        );
        //console.log(JSON.stringify(newOrUpdatedItems));
        
        newOrUpdatedItems.forEach(
            function(item){
                //console.log("to insert or update: " + JSON.stringify(item));
                if (item.hasOwnProperty('ID')){ 
                        $scope.db.insertOrUpdate("expenses", {ID: item.ID}, 
                            {
                                isPlan: false, 
                                date: item.date.yyyy_mm_dd(),  
                                expenseItemId: item.expenseItemId,  
                                amount: parseInt(item.amount), 
                                comment: item.comment, 
                                changeDate: operationDate,  
                                isActive: true
                            }
                        );
                        console.log("to update, amount: " + item.amount);
                    
                }
                else {
                    if (item.amount !== undefined){
                        $scope.db.insert("expenses",  
                            {
                                isPlan: false, 
                                date: item.date.yyyy_mm_dd(),  
                                expenseItemId: item.expenseItemId,  
                                amount: parseInt(item.amount), 
                                comment: item.comment, 
                                changeDate: operationDate,  
                                isActive: true
                            }
                        );
                        console.log("to insert, amount: " + item.amount);
                    }
                }
                    
                
                
            }
        )
        
        
        $scope.db.commit(); 
        $scope.expenses = [{ date: new Date(), expenseItemId: $scope.defaultExpenseItemId, comment: "" }]; //amount: 0, 
        $scope.newExpense = $scope.expenses[0]; 
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
        var l = $scope.expenses.length;
        if (l)
            $scope.newExpense = $scope.expenses[l-1];   
    }; 
    
      
    
    $scope.listExpensesByDay = function(day){
        $scope.listToEdit = $scope.db.queryAll("expenses", { query: { isActive: true } });

        $scope.expenses = []; 
        
        for (var key in $scope.listToEdit){
            $scope.expenses.push(
                { 
                    ID: $scope.listToEdit[key].ID,
                    isPlan: $scope.listToEdit[key].isPlan, 
                    date: new Date($scope.listToEdit[key].date), 
                    expenseItemId: $scope.listToEdit[key].expenseItemId, 
                    amount: $scope.listToEdit[key].amount, 
                    comment: $scope.listToEdit[key].comment,
                    changeDate: $scope.listToEdit[key].changeDate, 
                    isActive: $scope.listToEdit[key].isActive 
                }
            );
        };        
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
  
    $scope.editItem = function(expense){
        console.log(JSON.stringify(expense));
        $scope.newExpense = expense; 
    }
    
    $scope.getExpenseItemName = function(expenseItemId){
        var a = $scope.db.queryAll("expenseItems", {query: {ID: expenseItemId } });
        return a[0].name; 
    }

    $scope.addRow = function() {
        if ($scope.newExpense.amount){
            var o = { date: $scope.newExpense.date, expenseItemId: $scope.newExpense.expenseItemId, comment: "" };   
            $scope.newExpenses.push($scope.newExpense);
            $scope.newExpense = o;
            
            $timeout(function(){
                        document.getElementById("amountElement").focus();
                    }, 0);
        }
    };
    
    $scope.addNewExpenses = function() {
        for (var key in $scope.newExpenses){
            $scope.db.insert("expenses", {
                isPlan: false, 
                date: $scope.newExpenses[key].date.yyyy_mm_dd(),
                expenseItemId: $scope.newExpenses[key].expenseItemId, 
                amount: parseInt($scope.newExpenses[key].amount), 
                comment: $scope.newExpenses[key].comment 
            });
        }
        
        $scope.db.commit(); 
        $scope.newExpenses = []; 
        $scope.newExpense = { date: new Date(), expenseItemId: dataService.getActiveExpenseItem().ID, comment: "" };
    };
    
    $scope.deleteNewRow = function(e){
        var i = $scope.newExpenses.indexOf(e);
        $scope.newExpenses.splice(i, 1);
    }; 
    
    $scope.getTotalNewToSubmit = function(){
        var sum = 0;
        for (var key in $scope.newExpenses){
            var v = parseInt($scope.newExpenses[key].amount);
            if (!isNaN(v)) 
                sum += v; 
        };
         
        return sum; 
    };
    
    
    
    $scope.do1 = function(){
        console.log("do1");
    }
  
  
    
  
  
  });