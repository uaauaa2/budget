angular.module('budget.controllers').controller('OverviewCtrl', function($scope, $http, dataService) {
    $scope.expenseItems = [];
    $scope.auth = {code: "", token: ""};  
    
    $scope.stringdb = "";
    $scope.overviewMessages = dataService.overviewMessages; 


    $scope.init = function() {
        
            
            $scope.expenseItems = dataService.db.queryAll("expenseItems");
         
         
         
        //$scope.overviewMessages.push("init completed");
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
  
    
    
    
    /*$scope.fixSingle = function(oldId){
        var expenseItem = dataService.db.queryAll("expenseItems", {query: {ID: oldId}}); // //"22":{"ID":22,"orderNum":"22","levelNum":"4","title":"Телефон","name":"Телефон","idListForTotal":[22]}
        $scope.overviewMessages.push(JSON.stringify(expenseItem));
        
        // insert new row
        var newId = dataService.db.insert("expenseItems", expenseItem[0]);
        $scope.overviewMessages.push("newId: " + newId);
        
        // updating subtotal rows which refer to the current expense item
        dataService.db.update("expenseItems", 
            function(row) { // search function
                var i = row.idListForTotal.indexOf(oldId);     
                if(i != -1) {       
                    return true;
                } else {
                    return false;
                }
            }, 
            function(row) {
                var i = row.idListForTotal.indexOf(oldId);
                row.idListForTotal.splice(i, 1);
                row.idListForTotal.push(newId);
                return row;
            }
        ); 
        
        // updating expenses which refer to oldId
        dataService.db.update("expenses", 
            function(row) { // search function
                if(row.expenseItemId == oldId) {    
                    $scope.overviewMessages.push(JSON.stringify(row));   
                    return true;
                } else {
                    return false;
                }
            }, 
            function(row) {
                row.expenseItemId = newId;
                return row; 
            }
        );
        
        // delete old row
        dataService.db.deleteRows("expenseItems", {ID: oldId});
    }
    
    $scope.fixExpenseIds = function(){
        for (var i = 1; i < 60; i++){ 
            $scope.fixSingle(i); 
        }
        dataService.db.commit();
    }
    
    $scope.fixImported = function(){
        var lastDay = new Date("2015-07-04");
        var res = dataService.db.queryAll("expenses", {query: function(row) {
            var d = new Date(row.date); 
            if(d <= lastDay) {
                return true;
            } else {
                return false;
            }
        }});
        
        dataService.db.deleteRows("expenses", function(row) {
            var d = new Date(row.date); 
            if(d <= lastDay) {
                return true;
            } else {
                return false;
            }
        });
        
        res.forEach(function(row) {
            dataService.db.insert("expenses", row); 
        }, this);
        
        dataService.db.commit();
        $scope.overviewMessages.push("fixing imported done");
    }*/
    
    /*$scope.createChangesTable = function(){
        dataService.db.createTable("localChanges", ["tableName", "action", "rowId"]);
        dataService.db.commit();
        $scope.overviewMessages.push("table [localChanges] has been created");
    }*/
    
  
});