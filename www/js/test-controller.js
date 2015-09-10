
angular.module('budget.controllers').controller("TestCtrl", function($scope, $http, dataService, $filter) {
    //$scope.debug = { message: dataService.getDB() }; //.queryAll("expenseItems").length
    $scope.overviewMessages = dataService.overviewMessages;     
    $scope.db = null;
    
    
    $scope.test = function(){
        //clearTimeout($scope.syncTimer);
        alert(JSON.stringify(dataService.db));
    }
    
     
    
    $scope.allExpenseItems = [];
    $scope.expItems = {};
    $scope.initLatestExpenses = function(){
        var count = 11; 
        $scope.db = dataService.getDB();
        var expenses = $scope.db.queryAll("expenses", { sort: [["date", "DESC"]] });
        $scope.allExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
        
        $scope.allExpenseItems.forEach(function(element) {
            $scope.expItems[element.ID] = element; 
        }, this);
        
        /*var result = { 
            "2015-09-10": { date: "2015-09-10", expenses: [{ "еда": { amount: 100, list: [] } }, { "хозяйство": { amount: 500, list: [] } }] }, 
            "2015-09-09": { date: "2015-09-10", expenses: [{ "еда": { amount: 300, list: [] } }, { "хозяйство": { amount: 200, list: [] } }] }
        };*/
        
        
        
        var result = [];
        var add = function(expense) {
            var elementTo = null; 
            for (var i = 0; i < result.length; i++){
                if (expense.date == result[i].date && expense.expenseItemId == result[i].expenseItemId){
                    elementTo = result[i]; 
                    break; 
                }
            };
            if (elementTo){
                elementTo.amount += expense.amount; 
                if (expense.comment)
                    elementTo.comment += expense.comment + "; "; 
            } 
            else {
                result.push({ 
                    date: expense.date,
                    expenseItemId: expense.expenseItemId, 
                    expenseItemName: $scope.expItems[expense.expenseItemId].name, 
                    amount: expense.amount, 
                    comment: expense.comment 
                });
            }
        }
        
        var i = 0;  
        while (result.length < 10){
            add(expenses[i]);
            i++; 
        }
        
        return result; 
    }
    
    $scope.latestExpenses = $scope.initLatestExpenses();

});