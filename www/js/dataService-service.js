angular.module('budget.services').service('dataService', function ($http) {
    
    function errorHandler(data, status, headers, config) {
        overviewMessages.push("http error");
        console.log("http error");
    }
    
    function hashCode(s){
        var h = s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);  
        //console.log("length: " + s.length + "; hash: " + h); 
        return h;              
    }
    
    function createDatabase() {
        db.createTable("expenseItems", ["orderNum", "levelNum", "title", "name", "idListForTotal"]);
        db.createTable("expenses", ["isPlan", "date", "expenseItemId", "amount", "comment"]);
        db.createTable("income", ["isPlan", "date", "agent", "amount", "comment"]);
        db.createTable("balance", ["date", "totalAvailableToDate"]);
        db.createTable("localChanges", ["tableName", "action", "rowId"]);
        db.createTable("authToken", ["token"]);
            
        db.commit();
        console.log("new empty tables have been created");
        overviewMessages.push("new empty tables have been created");
    }
    
    function dumpDB(db){
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
            
            var changesRes = db.queryAll("localChanges"); 
            res += "[localChanges]: " + changesRes.length + "; ";
            
        } catch (error) {
            res += error;
        }
        
        return res;
    }
    
    
    function getAuthToken(authCode){
        var url = "https://oauth.yandex.ru/token";
        var data = "grant_type=authorization_code&code=" + authCode + 
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
            //$scope.auth.token = response.data.access_token; 
            overviewMessages.push("getAuthToken success"); // + JSON.stringify(response));
            saveToken(response.data.access_token); 
        }, 
        function(response) { // optional
            // failed
            overviewMessages.push("getAuthToken fail: " + JSON.stringify(response));
        });
    }
    
    function findNewRowsForTable(tableName, serverDB, localDB){
        var newRows = [];
        var serverRows = serverDB.queryAll(tableName);
        var localRows = localDB.queryAll(tableName);
        //overviewMessages.push("table [" + tableName + "]: " + serverRows.length + "/" + localRows.length + ";");
        
        var index;
        for (index = 0; index < localRows.length; ++index) {
            var r =  serverDB.queryAll(tableName, { query: { ID: localRows[index].ID }});      
            if (r.length == 0)
                newRows.push(localRows[index]);
        }
        //overviewMessages.push("new local rows for table [" + tableName + "]: " + JSON.stringify(newRows));
        
        return newRows;
    }
    
    function saveToken(newToken){
        auth.token = newToken;
        localStorage["authToken"] = auth.token;  
    }

    
    function syncTable(tableName, serverDB, localDB){
        //overviewMessages.push("table [" + tableName + "] sync has started");
        var resDB = serverDB;
        var index = 0; 
        
        // add to server db rows, which were added to local db previously
        var newRows = findNewRowsForTable(tableName, serverDB, localDB);
        
        if (newRows.length > 0){
            for (index = 0; index < newRows.length; ++index){
                //$scope.overviewMessages.push("prepared id: " + newRows[index].ID);
                var newId = resDB.insert(tableName, newRows[index]);
                //$scope.overviewMessages.push("inserted id: " + newId);
            }
            overviewMessages.push("table [" + tableName + "] has been synced, rows added: " + index);
        }
        else {
            //$scope.overviewMessages.push("table [" + tableName + "] has no new rows");
        }
        
        // delete from server db rows, which were deleted from local db previously
        var deletedRows = resDB.queryAll("localChanges", { query: {tableName: tableName, action: "delete"}});
        var d = 0; 
        var d1 = 0; 
        //$scope.overviewMessages.push("localChanges[" + tableName + "] count: " + deletedRows.length);
        for (index = 0; index < deletedRows.length; ++index){
            d1 = resDB.deleteRows(tableName, {ID: deletedRows[index].rowId});
            /*if (d1 != 0)
                $scope.overviewMessages.push("deleted id: " + deletedRows[index].rowId + " d1: " + d1);
            else 
                $scope.overviewMessages.push("not found id: " + deletedRows[index].rowId);*/
            d += d1; 
        }
        if (d > 0) 
            overviewMessages.push("table [" + tableName + "] rows removed: " + d);
        
        return resDB;    
    } 
    
    function uploadDB(){
        var revision = "0";  
        
        $http({
            method: 'PUT',
            url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbName + "/",
            headers: { "Authorization": auth.token }  
        }).success(function(response) {
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
                                        "string": db.serialize(),
                                    }
                            }]
                    }] 
            };
 
            $http({
                method: "POST",
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbName + "/deltas/",
                data: delta,  
                headers: { "Authorization": auth.token, "If-Match": revision }
            }).success(function(response) {
            	overviewMessages.push("uploaded");
                syncStatus.status = 2; 
                webDBhash = hashCode(db.serialize());
            }).error(errorHandler);
             
        }).error(errorHandler);
   	
        
    } 
    
    function syncFromWeb(){
        if (auth.token != ""){
            $http({
                method: "GET",
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbName + "/snapshot/",  
                headers: { "Authorization": auth.token }
            }).success(function(response) {
                var sWebDB = response.records.items[0].fields[0].value.string;
                var webDB = new localStorageDB("web_" + dbName, localStorage);
                webDB.initFromObj(JSON.parse(sWebDB));
                //overviewMessages.push("webDB: " + dumpDB(webDB));
                webDBhash = hashCode(webDB.serialize()); 
                if (webDBhash != hashCode(db.serialize())){
                    syncStatus.status = 1; 
                    var newDB = webDB;
                    newDB = syncTable("localChanges", newDB, db);
                    newDB = syncTable("expenseItems", newDB, db);
                    newDB = syncTable("expenses", newDB, db);
                    newDB = syncTable("income", newDB, db);
                    newDB = syncTable("balance", newDB, db);
                    //newDB = syncTable("authToken", newDB, db);
                    
                    db.initFromObj(newDB.getDBObj());
                    overviewMessages.push("synced"); //, result: " + dumpDB(db));
                    db.commit();
                    overviewMessages.push("resulting db committed to local storage"); 
                    uploadDB();
                    
                }
                else {
                    overviewMessages.push("server and local dbs are equal");
                    syncStatus.status = 2;
                }
                
            })
            .error(errorHandler)
        }
    }
    
    function downloadDB(){
        $http({
            method: "GET",
            url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbName + "/snapshot/",  
            headers: { "Authorization": auth.token }
        }).success(function(response) {
            var stringdb = response.records.items[0].fields[0].value.string;
            overviewMessages.push("downloaded");
            var testdb = JSON.parse(stringdb);
            db.initFromObj(testdb);
            db.commit();
            overviewMessages.push("committed");
        }).error(errorHandler);
    }
    
    var db = {test: "ok"};
    
    var init = function() {
        db = new localStorageDB(dbName, localStorage);
             
        if(db.isNew()) {
            createDatabase();
        }
        
        //overviewMessages.push("localStorage: " + dumpDB(db)); 
        
        auth.token = localStorage["authToken"]; 
                
        syncStatus.status = 0;
        syncFromWeb();
    }
    
    function getSyncStatus(){
        if (syncStatus.status != 1){
            if (webDBhash != hashCode(db.serialize()))
                syncStatus.status = 0; 
            else 
                syncStatus.status = 2;
        } 
            
        return syncStatus; 
    }
    
    var dbName = "budget2015";
    var auth = { code: "", token: "" }; 
     
    var overviewMessages = [];
    var webDBhash = null; 
    var syncStatus = {
        status: 0, 
        statusText: function(){
            var t = "Not in sync";
            
            if (this.status == 1)
                t = "Syncing"; 
            else if (this.status == 2) 
                t = "In Sync"
            return t;  
        }
    } 
    
    return {
        getDB: function() { return db; }, 
        auth: auth, 
        overviewMessages: overviewMessages,
        
        init: init, 
        sync: syncFromWeb, 
        getAuthToken: getAuthToken,
        getSyncStatus: getSyncStatus
        
        
    } 
     
        
        
 
}); 
