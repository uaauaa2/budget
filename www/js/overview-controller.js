angular.module('budget.controllers').controller('OverviewCtrl', function($scope, $http, dataService) {
    $scope.allExpenseItems = [];
    $scope.expItems = {};

    $scope.auth = {code: "", token: ""};  
    
    $scope.stringdb = "";
    $scope.overviewMessages = dataService.overviewMessages;
    $scope.latestActions = []; 
    

    $scope.init = function() {
        
    };
    
    
    $scope.getLevel = function(expenseItem){
        return expenseItem.levelNum; 
    };
    
    $scope.getTitle = function(expenseItem){
        return expenseItem.title; 
    }
    
    $scope.getTotalByMonth = function(expenseItem, month){
        //var title = $scope.getTitle(expenseItem); 
        //var level = $scope.getLevel(expenseItem);
                
        var monthString = "" + month;
        if (monthString.length == 1)
            monthString = "0" + monthString; 
             
        var result = dataService.db.queryAll("expenses", { 
            query: function(row) {
                if (expenseItem.idListForTotal.indexOf(row.expenseItemId) >= 0 && row.date.indexOf("-" + monthString +  "-") >= 0) {
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
  
    $scope.getAuthToken = function(){
        dataService.getAuthToken($scope.auth.code); 
    }

    
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


        $scope.db = dataService.getDB();

        $scope.allExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
        $scope.allExpenseItems.forEach(function (element) {
            $scope.expItems[element.ID] = element;
        }, this);

        var expenses = $scope.db.queryAll("expenses", { sort: [["date", "DESC"]], distinct: ["date"] });
        
        var dateFrom = new Date();
        if (expenses[9])
             dateFrom = new Date(expenses[9].date);

        expenses = $scope.db.queryAll("expenses", {
            query: function (row) {
                var d = new Date(row.date);
                if (d >= dateFrom && row.isActive)
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

    
    $scope.currentDb = { name: localStorage["dbName"] };   
    $scope.databases = dataService.getListOfDatabases(); 
    
    $scope.switchDatabase = function(){
        localStorage["dbName"] = $scope.currentDb.name;
        dataService.init(); 
    }
    
    $scope.deleteDatabase = function(){
        if (confirm("Are you sure you want to delete the database [" + $scope.currentDb.name + "]?")) {
            //alert("delete!")
            dataService.deleteDatabase($scope.currentDb.name)
                .then(
                    function(){
                        dataService.initListOfDatabases().then( 
                            function () {
                                $scope.databases = dataService.getListOfDatabases();
                                if ($scope.databases.length > 0){
                                    $scope.currentDb.name = $scope.databases[0];  
                                    $scope.switchDatabase(); 
                                }
                            }
                        )
                        
                    }
            );
        } else {
            // Do nothing!
        }
        
    }
    
    $scope.createNewDatabase = function(){
        $scope.currentDb.name = prompt("please enter new db name", "newDatabase");
        $scope.switchDatabase();
    }
 
  
});