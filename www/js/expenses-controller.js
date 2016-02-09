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

    $scope.findChildren = function(expenseItem){
        var result = []; 
        var found = false;
        
        for (var j = 0; j < $scope.allExpenseItems.length; j++) {
            if (!found && expenseItem.ID == $scope.allExpenseItems[j].ID){
                found = true;
                continue;
            }
            if (found){    
                if ($scope.allExpenseItems[j].levelNum > expenseItem.levelNum){
                    var o = JSON.parse(JSON.stringify($scope.allExpenseItems[j]));
                    result.push(o);
                }
                else 
                    break;
            }
            
        }

        return result; 
    }
    
    $scope.expandCollapse = function(currentExpenseItem){
        var i = $scope.expensesTableExpenseItems.indexOf(currentExpenseItem);
        
        if ($scope.expensesTableExpenseItems[i + 1] && $scope.expensesTableExpenseItems[i + 1].levelNum > $scope.expensesTableExpenseItems[i].levelNum){
            // collapse
            while ($scope.expensesTableExpenseItems[i + 1] 
                && $scope.expensesTableExpenseItems[i + 1].levelNum > $scope.expensesTableExpenseItems[i].levelNum){
                $scope.expensesTableExpenseItems.splice(i + 1, 1);
            }
            $scope.expensesTableExpenseItems[i].title = "+ " + $scope.expensesTableExpenseItems[i].title;
        }
        else {
            if ($scope.expensesTableExpenseItems[i].idListForTotal.length > 1){ 
                // expand
                var children = $scope.findChildren(currentExpenseItem);
                  
                var k = i; 
                children.forEach(function(element) {
                    $scope.expensesTableExpenseItems.splice(++k, 0, element);
                }, this);
                
                if ($scope.expensesTableExpenseItems[i].title.startsWith("+ "))
                      $scope.expensesTableExpenseItems[i].title = $scope.expensesTableExpenseItems[i].title.substring(2);  
            }
        }
        
        

              
        /*var o = { levelNum: e.levelNum, title: "", name: ""}; 
        $scope.newExpenseItems.splice(i + 1, 0, o);*/
        
    }

    $scope.moveLeft = function(){
        var first = $scope.days[0];
        var last = $scope.days[$scope.days.length - 1]; 
        if (first > 1 && last <= 31){
            $scope.days.pop(); 
            $scope.days.unshift(first - 1); 
        }
        //console.log($scope.days);
    }
    
    $scope.moveRight = function(){
        var first = $scope.days[0];
        var last = $scope.days[$scope.days.length - 1]; 
        if (first >= 1 && last < 31){
            $scope.days.shift(); 
            $scope.days.push(last + 1); 
        }
        //console.log($scope.days);
    }
    
    $scope.addDay = function(){
        var last = $scope.days[$scope.days.length - 1]; 
        if (last < 31){
            $scope.days.push(last + 1); 
        }
    }
    
    $scope.getTotalByDay = function(expenseItem, month, day){
        var monthString = "" + month;
        if (monthString.length == 1)
            monthString = "0" + monthString; 
        var dayString = "" + day;
        if (dayString.length == 1)
            dayString = "0" + dayString;
             
        var result = $scope.db.queryAll("expenses", { 
            query: function(row) {
                if (row.isPlan == false && row.isActive && expenseItem.idListForTotal
                    && expenseItem.idListForTotal.indexOf(row.expenseItemId) >= 0 
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
    
    $scope.getValue = function(expenseItem, month, day){
        var queryDate = new Date();
        queryDate.setMonth($scope.month - 1); 
        queryDate.setDate(day); 
        var queryDateString = queryDate.yyyy_mm_dd();
             
        var result = $scope.db.queryAll("expenses", { 
            query: function(row) {
                if (row.isPlan == false 
                    && row.isActive
                    && row.expenseItemId == expenseItem.ID  
                    && row.date == queryDateString) {
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
        return (sum == 0)? "" : sum.toString(); 
    }
    
    $scope.getTotalByMonth = function(expenseItem, month, isPlan){
        //var title = $scope.getTitle(expenseItem); 
                
        var monthString = "" + month;
        if (monthString.length == 1)
            monthString = "0" + monthString; 
             
        var result = $scope.db.queryAll("expenses", { 
                            query: function(row) {
                                if (row.isPlan == isPlan && row.isActive
                                    && expenseItem.idListForTotal
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
        console.log("update table, month: " + $scope.month); 
        $scope.expensesTable = []; 
        for (var expIndex in $scope.allExpenseItems){
            var e = $scope.allExpenseItems[expIndex]; 
            var oByDay = []; 
            for (var i = 1; i <= 31; i++){
                oByDay[i] = $scope.getTotalByDay(e, $scope.month, i); //$scope.getValue(e, $scope.month, i); 
            }
            
            var o = {expenseItemId:  e.ID, values: {totalPlan: $scope.getTotalByMonth(e, $scope.month, true), 
                                                    totalSpent: $scope.getTotalByMonth(e, $scope.month, false), 
                                                    spentByDay: oByDay} }; 
            $scope.expensesTable.push(o); 
        }
    };
    
    
    
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
    
    $scope.listExpensesByExpenseItemId = function(expenseItemId){
        //console.log(expenseItemId); 
        var fn = function(row) {
            //console.log(row.expenseItemId);   
            if (row.isPlan == false && row.isActive && row.expenseItemId == expenseItemId){
                return true;
            } else {
                return false;
            }
        }
        $scope.listExpensesBy(fn); 
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
    
    $scope.getTableValueTotal = function(expenseId){
        var res = "";
        var found = ($filter('filter')($scope.expensesTable, {expenseItemId: expenseId}, true));
        
        if (found.length){
            res = found[0].values.totalSpent; 
        }
        return res; 
    }; 
    $scope.getTableValueTotalPlan = function(expenseId){
        var res = "";
        var found = ($filter('filter')($scope.expensesTable, {expenseItemId: expenseId}, true));
        
        if (found.length){
            res = found[0].values.totalPlan; 
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
    
    /*$scope.loadTableTimer = $timeout(function tick(){
        $scope.updateExpensesTable(); 
    }, 100);*/

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