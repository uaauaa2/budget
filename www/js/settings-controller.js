angular.module('budget.controllers').controller('SettingsCtrl', function($scope, $http, dataService) {
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

    


    
    $scope.currentDb = { name: localStorage["dbName"] };   
    $scope.databases = dataService.getListOfDatabases(); 
    
    $scope.switchDatabase = function(){
        localStorage["dbName"] = $scope.currentDb.name;
        dataService.init();
        //TODO: to rewrite with promise, .then updateListOfDatabases;   
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
        var newdb = prompt("please enter new db name", "newDatabase");
        $scope.databases.push(newdb);
        $scope.currentDb.name = newdb;
        
        $scope.switchDatabase();
    }
    
     function uploadDB(){
        
   	
        
    } 
    /*$scope.updateOldDb = function(){
        if(! ($scope.db.columnExists("expenseItems", "changeDate") && $scope.db.columnExists("expenseItems", "isActive")) ) {
            $scope.db.alterTable("expenseItems", ["changeDate", "isActive"]);
        }
        if(! ($scope.db.columnExists("expenses", "changeDate") && $scope.db.columnExists("expenses", "isActive")) ) {
            $scope.db.alterTable("expenses", ["changeDate", "isActive"]);
        }
        if(! ($scope.db.columnExists("income", "changeDate") && $scope.db.columnExists("income", "isActive")) ) {
            $scope.db.alterTable("income", ["changeDate", "isActive"]);
        }
        
        $scope.db.commit();
        
        $scope.db.update("expenseItems", function(row) { return true; },            
            function(row) { // update function
                var opDate = new Date("2015-01-01");
                row.changeDate = opDate.formatFull(); 
                row.isActive = true; 
                return row;
            }
        );
        
        $scope.db.update("expenses", function(row) { return true; },            
            function(row) { // update function
                var opDate = new Date(row.date);
                row.changeDate = opDate.formatFull(); 
                row.isActive = true; 
                return row;
            }
        );
        
        $scope.db.update("income", function(row) { return true; },            
            function(row) { // update function
                var opDate = new Date(row.date);
                row.changeDate = opDate.formatFull(); 
                row.isActive = true; 
                return row;
            }
        );
        $scope.db.commit();
        dataService.uploadDB1("budget2015_updated", $scope.db);
    }*/
 
  
});