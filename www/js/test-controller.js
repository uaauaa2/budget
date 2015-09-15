
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
        
        
        /*var result = { 
            "2015-09-10": { date: "2015-09-10", expenses: { "еда": { expenseItemName: "eda", amount: 100, comment: "moloko" }, 
                                                            "хозяйство": { expenseItemName: "хозяйство", amount: 500, comment: "dkkdkd" }
                                                          }
                          }, 
                                                           
            "2015-09-09": { date: "2015-09-09", expenses: { "еда": { expenseItemName: "eda", amount: 200, comment: "xleb" }, 
                                                            "хозяйство": { expenseItemName: "хозяйство", amount: 2500, comment: "eeeed" }
                                                          }
                          }
        };*/
        
        
        
        var result = {};
        var add = function(expense) {
            var dateElementTo = result[expense.date]; 
            
            if (!dateElementTo) {
                dateElementTo = { date: expense.date, totalAmount: 0, expenses: {} }; 
                result[expense.date] = dateElementTo;
            }
            dateElementTo.totalAmount += expense.amount;  
            
            var expenseItemElementTo = dateElementTo.expenses[expense.expenseItemId];
            
            if (!expenseItemElementTo){
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
                    expenseItemElementTo.comment += expense.comment + "; ";
            }
        }
        
        
        $scope.db = dataService.getDB();
        
        $scope.allExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
        $scope.allExpenseItems.forEach(function(element) {
            $scope.expItems[element.ID] = element; 
        }, this);
        
        var expenses = $scope.db.queryAll("expenses", { sort: [["date", "DESC"]], distinct : ["date"] });
        var dateFrom = new Date(expenses[2].date);
        
        expenses = $scope.db.queryAll("expenses", { query: function(row) {
                var d = new Date(row.date); 
                if (d >= dateFrom)
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

});