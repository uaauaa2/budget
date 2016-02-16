angular.module('budget.controllers').controller("ExpensesCtrl", function($scope, $http, dataService, $filter, $timeout) {
    $scope.debugText = "";

    $scope.month = (new Date()).getMonth() + 1;
    $scope.year = (new Date()).getFullYear(); 
    $scope.days = [];
    $scope.total = ""; 
    var currentDay = new Date().getDate(); 
    for (var i = (currentDay - 7 > 0)? currentDay - 7 : 1; i <= ((currentDay < 31)? currentDay + 1 : currentDay); i++)
        $scope.days.push(i); 
    $scope.expensesTable = [];
    $scope.expensesTableExpenseItems = [];   
    $scope.queryFn = null;
    $scope.newExpense = null; 
    
    //$scope.db = null;
    $scope.db = dataService.getDB(); 
      
    
    $scope.expenseItems = {};
    $scope.allExpenseItems = [];
    $scope.defaultExpenseItemId = null;
    $scope.expenses = [];  
    $scope.newExpenses = []; // for mobile version
    $scope.activeExpenseItem = null; 
    $scope.listToEdit = []; 

    $scope.allExpenseItems = [];
    $scope.expItems = {};

    $scope.initLatestExpenses = function () {
        var result = {};
        var add = function (expense) {
            var dateElementTo = result[expense.date];

            if (!dateElementTo) {
                dateElementTo = { date: expense.date, totalAmount: 0, expenses: {} };
                result[expense.date] = dateElementTo;
            }
            dateElementTo.totalAmount += expense.amount;

            var expenseItemElementTo = dateElementTo.expenses[expense.expenseItemId];

            if (!expenseItemElementTo) {
                expenseItemElementTo = {
                    expenseItemId: expense.expenseItemId,
                    expenseItemName: $scope.expItems[expense.expenseItemId].name,
                    amount: expense.amount,
                    comment: expense.comment
                }
                dateElementTo.expenses[expense.expenseItemId] = expenseItemElementTo;
            }
            else {
                expenseItemElementTo.amount += expense.amount;
                if (expenseItemElementTo.comment)
                    expenseItemElementTo.comment += "; " + expense.comment;
            }
        }

        $scope.allExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
        $scope.allExpenseItems.forEach(function (element) {
            $scope.expItems[element.ID] = element;
        }, this);

        var expenses = $scope.db.queryAll("expenses", { sort: [["date", "DESC"]], distinct: ["date"] });
        
        var dateFrom = new Date();
        if (expenses.length > 5)
             dateFrom = new Date(expenses[4].date);
        else if (expenses.length > 0)
            dateFrom = new Date(expenses[expenses.length - 1].date);

        expenses = $scope.db.queryAll("expenses", {
            query: function (row) {
                var d = new Date(row.date);
                if (d >= dateFrom && row.isActive && !row.isPlan)
                    return true;
                else
                    return false;
            }
        });


        for (var k = 0; k < expenses.length; k++) {
            add(expenses[k]);
        }

        result.days = Object.keys(result);
        result.days.sort();
        result.days.reverse();

        return result;
    }

    $scope.latestExpenses = $scope.initLatestExpenses();
    
    
    
    $scope.init = function() {
        //$scope.db = dataService.getDB();
        $scope.allExpenseItems = $scope.db.queryAll("expenseItems", { query: { isActive: true }, sort: [["orderNum", "ASC"]] });
        $scope.expensesTableExpenseItems = $scope.db.queryAll("expenseItems", { query: { isActive: true }, sort: [["orderNum", "ASC"]] });
        $scope.expenseItems = $scope.db.queryAll("expenseItems", { 
            query: function(row) {
                var res = false;
                if (row.name != null && row.isActive == true){
                    res = true;
                }
                return res; 
            }, 
            sort: [["orderNum", "ASC"]]
        });
        
        if ($scope.expenseItems.length > 0){
            $scope.defaultExpenseItemId = $scope.expenseItems[0].ID;   
            $scope.expenses = [{ date: new Date(), expenseItemId: $scope.defaultExpenseItemId, comment: "" }]; //, amount: 0,
            $scope.newExpenses = [];
            $scope.newExpense = { date: new Date(), expenseItemId: dataService.getActiveExpenseItem().ID, comment: "" };
            $scope.activeExpenseItem = dataService.getActiveExpenseItem();
        }    
    };
    
    $scope.init(); 
    
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
        $scope.latestExpenses = $scope.initLatestExpenses();
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
    
    $scope.listExpensesBy = function(queryFn){
        $scope.listToEdit = $scope.db.queryAll("expenses", { query: queryFn });

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

    $scope.listExpensesByDay = function(day){
        var queryDate = new Date();
        queryDate.setMonth($scope.month - 1); 
        queryDate.setDate(day); 
        var queryDateString = queryDate.yyyy_mm_dd(); 
       
        var fn = function(row) {
            if (row.isPlan == false && row.isActive && row.date == queryDateString){  
                return true;
            } else {
                return false;
            }
        }
        $scope.listExpensesBy(fn); 
    };
    
    $scope.listExpensesByExpenseItemIdAndDay = function(expenseItemId, day){
        var queryDate = new Date();
        queryDate.setMonth($scope.month - 1); 
        queryDate.setDate(day); 
        var queryDateString = queryDate.yyyy_mm_dd(); 
       
        var fn = function(row) {
            if (row.isPlan == false && row.isActive 
                && row.date == queryDateString 
                && row.expenseItemId == expenseItemId){  
                return true;
            } else {
                return false;
            }
        }
        $scope.listExpensesBy(fn); 
    };
    
    

    // ---------------------- below is the code for mobile version
    
    $scope.$watch('activeExpenseItem', function(newVal, oldVal){
        if ($scope.activeExpenseItem)
            $scope.newExpense.expenseItemId = $scope.activeExpenseItem.ID; 
    }, true);
  
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
            $scope.newExpenses.unshift($scope.newExpense);
            $scope.newExpense = o;
            
            $timeout(function(){
                if (document.getElementById("amountElement"))
                        document.getElementById("amountElement").focus();
                    }, 0);
        }
    };
    
    $scope.addNewExpenses = function() {
        var operationDate = (new Date()).formatFull();
        for (var key in $scope.newExpenses){
            $scope.db.insert("expenses", 
                            {
                                isPlan: false, 
                                date: $scope.newExpenses[key].date.yyyy_mm_dd(),  
                                expenseItemId: $scope.newExpenses[key].expenseItemId,  
                                amount: parseInt($scope.newExpenses[key].amount), 
                                comment: $scope.newExpenses[key].comment, 
                                changeDate: operationDate,  
                                isActive: true
                            }
            );
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
    
    $scope.keypad = function(cmd){
        if (!$scope.newExpense.amount)
                $scope.newExpense.amount = "";
        var d; 
        if (cmd >=0 || cmd < 0){ // cmd is a number
            $scope.newExpense.amount += cmd;
        } 
        else {
            if (cmd == "<-")
                $scope.newExpense.amount = $scope.newExpense.amount.substring(0, $scope.newExpense.amount.length - 1);
            else if (cmd == "C")
                $scope.newExpense.amount = "";
            else if (cmd == "<"){
                d = new Date(); 
                d.setDate($scope.newExpense.date.getDate() - 1);
                $scope.newExpense.date = d;
            }
            else if (cmd == ">"){
                d = new Date(); 
                d.setDate($scope.newExpense.date.getDate() + 1);
                $scope.newExpense.date = d;
            } 
        }
    }
    
    $scope.sync = function(){
        dataService.sync();
    }
    
    $scope.syncStatus = dataService.getSyncStatus();
    
    $scope.syncTimer = $timeout(function tick(){
        $scope.syncStatus = dataService.getSyncStatus();

        $scope.syncTimer = $timeout(tick, 3000); 
    }, 3000);
    
  
    
  
  
  });