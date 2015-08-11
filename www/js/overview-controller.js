angular.module('budget.controllers').controller('OverviewCtrl', function($scope, $http, dataService) {
    $scope.expenseItems = [];
    $scope.auth = {code: "", token: ""};  
    
    $scope.stringdb = "";
    $scope.overviewMessages = []; 


    $scope.errorHandler = function(data, status, headers, config) {
        $scope.overviewMessages.push("http error");
    }    

    $scope.fillExpenseItemsTable = function() {
        $scope.overviewMessages.push("fill expense items table: nothing has happened");
    };
    
    $scope.importExpenses = function() {
        $scope.overviewMessages.push("import expenses: nothing has happened"); 
    }

    $scope.createDatabase = function(){
        dataService.db.createTable("expenseItems", ["orderNum", "levelNum", "title", "name", "idListForTotal"]);
        $scope.fillExpenseItemsTable();
        dataService.db.createTable("expenses", ["isPlan", "date", "expenseItemId", "amount", "comment"]);
        dataService.db.createTable("authToken", ["token"]);
            
        dataService.db.commit();
    }
    
    $scope.dumpDB = function(db){
        var res = ""; 
        
        try {
            var expenseItems = db.queryAll("expenseItems");
            res += "[expenseItems]: " + expenseItems.length + "; "; 
            
            var exList = db.queryAll("expenses");
            res += "[expenses]: " + exList.length + "; ";
            
            var incomeList = db.queryAll("income");
            res += "[income]: " + incomeList.length + "; ";
            
            var balanceList = db.queryAll("balance");
            res += "[balance]: " + balanceList.length + "; ";
            
            var tokenRes = db.queryAll("authToken"); 
            res += "[authToken]: " + tokenRes.length + "; ";
            
            /*if (tokenRes.length > 0){
                res += "authToken: " + tokenRes[0].token + "; ";
            }*/    
        } catch (error) {
            res += error;
        }
        
        
        return res;
    }
    
    $scope.findNewRowsForTable = function(tableName, serverDB, localDB){
        var newRows = [];
        var serverRows = serverDB.queryAll(tableName);
        var localRows = localDB.queryAll(tableName);
        $scope.overviewMessages.push("table [" + tableName + "]: " + serverRows.length + "/" + localRows.length + ";");
        
        var index;
        for (index = 0; index < localRows.length; ++index) {
            var r =  serverDB.queryAll(tableName, { query: { ID: localRows[index].ID }});      
            if (r.length == 0)
                newRows.push(localRows[index]);
        }
        //$scope.overviewMessages.push("new local rows for table [" + tableName + "]: " + JSON.stringify(newRows));
        
        return newRows;
    }
    
    $scope.hashCode = function(s){
        var h = s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);  
        $scope.overviewMessages.push("hash: " + h);
        return h;              
    }
    
    $scope.syncTable = function(tableName, serverDB, localDB){
        $scope.overviewMessages.push("table [" + tableName + "] sync has started");
        var resDB = serverDB;
        var index = 0; 
        
        // add to server db rows, which were added to local db previously
        var newRows = $scope.findNewRowsForTable(tableName, serverDB, localDB);
        
        if (newRows.length > 0){
            for (index = 0; index < newRows.length; ++index){
                resDB.insert(tableName, newRows[index]);
            }
            $scope.overviewMessages.push("table [" + tableName + "] has been synced, rows added: " + index);
        }
        else {
            $scope.overviewMessages.push("table [" + tableName + "] has no new rows");
        }
        
        // delete from server db rows, which were deleted from local db previously
        // there is no need to delete rows from [localChanges] table as resulting db will be based on server db and this table is empty there 
        var deletedRows = dataService.db.queryAll("localChanges", { query: {tableName: tableName, action: "delete"}});
        for (index = 0; index < deletedRows.length; ++index){
            resDB.deleteRows(tableName, {ID: deletedRows[index].rowId}); 
        } 
        $scope.overviewMessages.push("table [" + tableName + "] rows removed: " + index);
        
        return resDB;    
    } 
    
    $scope.syncFromWeb = function(){
        if ($scope.auth.token != ""){
            $http({
                method: "GET",
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/snapshot/",  
                headers: { "Authorization": $scope.auth.token }
            }).success(function(response) {
                var sWebDB = response.records.items[0].fields[0].value.string;
                var webDB = new localStorageDB("web_" + dataService.dbName, localStorage);
                webDB.initFromObj(JSON.parse(sWebDB));
                
                if ($scope.hashCode(webDB.serialize()) != $scope.hashCode(dataService.db.serialize())){
                    var newDB = webDB;
                    newDB = $scope.syncTable("expenseItems", newDB, dataService.db);
                    newDB = $scope.syncTable("expenses", newDB, dataService.db);
                    newDB = $scope.syncTable("income", newDB, dataService.db);
                    newDB = $scope.syncTable("balance", newDB, dataService.db);
                    newDB = $scope.syncTable("authToken", newDB, dataService.db);
                    
                    dataService.db.initFromObj(newDB.getDBObj());
                    $scope.overviewMessages.push("synced, result: " + $scope.dumpDB(dataService.db));
                    dataService.db.commit();
                    $scope.overviewMessages.push("resulting db committed to local storage"); 
                    $scope.uploadDB();
                    
                }
                else {
                    $scope.overviewMessages.push("server and local dbs are equal");
                }
                
            })/*.error(function(response) { 
                $scope.overviewMessages.push("error: " + JSON.stringify(response));
                alert("error"); 
            })*/
            .error($scope.errorHandler)
        }
    }
        
    
    $scope.init = function() {
        if (dataService.db == null){
            
            dataService.db = new localStorageDB(dataService.dbName, localStorage);
             
            if( dataService.db.isNew() ) {
                $scope.createDatabase();
            }
            var tokenRes = dataService.db.queryAll("authToken"); 
            
            if (tokenRes.length > 0){
                $scope.auth.token = tokenRes[0].token;
            }
            
            $scope.syncFromWeb();
            
            $scope.expenseItems = dataService.db.queryAll("expenseItems");
        } 
         
         
        //$scope.overviewMessages.push("init completed");
    };
    
    
    $scope.init(); 
    
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
  
    $scope.drop = function() {
        dataService.db = new localStorageDB(dataService.dbName, localStorage);
            
        dataService.db.drop(); 
        dataService.db.commit();
        alert("dataService.db has been deleted");
    };
    
    $scope.getAuthToken = function(){
        var url = "https://oauth.yandex.ru/token";
        var data = "grant_type=authorization_code&code=" + $scope.auth.code + 
            "&client_id=6afb425aacb947d3b832f580335ecb4d&client_secret=44667bacbbf342c0994386fe29b97374" ;
             
        $http({
            method: 'POST',
            url: url,
            data: data,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
        /*$http.post({
            url,
            data,
            {'Content-Type': 'application/x-www-form-urlencoded'}
        })*/.then(function(response) {
            // success
            $scope.auth.token = response.data.access_token; 
            $scope.overviewMessages.push("success: " + JSON.stringify(response));
            $scope.saveToken(); 
        }, 
        function(response) { // optional
            // failed
            $scope.overviewMessages.push("fail: " + JSON.stringify(response));
        });
        
    	
    
    }
    
    $scope.saveToken = function(){
        //dataService.db.createTable("authToken", ["token"]);
        dataService.db.deleteRows("authToken");
        dataService.db.insert("authToken", {token: $scope.auth.token });
        dataService.db.commit();
    }

    $scope.uploadDB = function(){
        var revision = "0";  
        
        $http({
            method: 'PUT',
            url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/",
            headers: { "Authorization": $scope.auth.token }  
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
 
            $http({
                method: "POST",
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/deltas/",
                data: delta,  
                headers: { "Authorization": $scope.auth.token, "If-Match": revision }
            }).success(function(response) {
            	//$scope.overviewMessages.push("success: " + JSON.stringify(response));
                $scope.overviewMessages.push("resulting db uploaded to web");
                $scope.overviewMessages.push(" ");
                $scope.overviewMessages.push("sync completed");
            }).error($scope.errorHandler);
             
        }).error($scope.errorHandler);
   	
        
    } 

    $scope.downloadDB = function(){
        $http({
            method: "GET",
            url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/snapshot/",  
            headers: { "Authorization": $scope.auth.token }
        }).success(function(response) {
            $scope.stringdb = response.records.items[0].fields[0].value.string;
            $scope.overviewMessages.push("downloaded");
            $scope.commitdbfromeditbox(); 
        }).error($scope.errorHandler);
    }
    
    $scope.commitdbfromeditbox = function(){
        var testdb = JSON.parse($scope.stringdb);
        dataService.db.initFromObj(testdb);
        dataService.db.commit();
        $scope.overviewMessages.push("committed"); 
    }
    
    $scope.createIncomeTable = function(){
        dataService.db.createTable("income", ["isPlan", "date", "agent", "amount", "comment"]);
        dataService.db.commit();
    }
    
    $scope.importIncome = function(){
        $scope.overviewMessages.push("fill income table: nothing has happened");     
        dataService.db.commit();
    }
    
    $scope.createBalanceTable = function(){
        dataService.db.createTable("balance", ["date", "totalAvailableToDate"]);
        dataService.db.commit();
    }
    
    $scope.fixSingle = function(oldId){
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
    }
    
    $scope.createChangesTable = function(){
        dataService.db.createTable("localChanges", ["tableName", "action", "rowId"]);
        dataService.db.commit();
        $scope.overviewMessages.push("table [localChanges] has been created");
    }
    
  
});