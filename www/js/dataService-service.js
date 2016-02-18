/* global localStorageDB */
/// <reference path="../../typings/angularjs/angular.d.ts"/>

Date.prototype.yyyy_mm_dd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding
};

Date.prototype.formatFull = function() {
   var yyyy = this.getFullYear().toString();
   var MM = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   var HH  = this.getHours().toString();
   var mm  = this.getMinutes().toString();
   
   return yyyy + "-" + (MM[1]?MM:"0"+MM[0]) + "-" + (dd[1]?dd:"0"+dd[0])
   		+ " " + (HH[1]?HH:"0"+HH[0]) + ":" + (mm[1]?mm:"0"+mm[0]); // padding
};


angular.module('budget.services').service('dataService', function ($http) {
    
    function errorHandler(data, status, headers, config) {
        var l = 200;
        var msg = ""; 
        if (data && data.message){
             msg = data.message.substring(0, l);
        }
        var s = "http error! " + 
            ("data: " + JSON.stringify(data)).substring(0, l) + 
            "; message: " + msg +
            ("; status: " + JSON.stringify(status)).substring(0, l) +
            ("; headers: " + JSON.stringify(headers)).substring(0, l) +
            ("; config: " + JSON.stringify(config)).substring(0, l);
            
        overviewMessages.push(s);
        console.log(s);
    }
    
    function hashCode(s){
        var h = s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);  
        //console.log("length: " + s.length + "; hash: " + h);
        //var h = s.length;  
        return h;              
    }

    function createDatabase() {
        db.createTable("expenseItems", ["orderNum", "levelNum", "title", "name", "idListForTotal", "changeDate", "isActive"]);
        db.createTable("expenses", ["isPlan", "date", "expenseItemId", "amount", "comment", "changeDate", "isActive"]);
        db.createTable("income", ["isPlan", "date", "agent", "amount", "comment", "changeDate", "isActive"]);
        db.createTable("balance", ["date", "totalAvailableToDate", "changeDate", "isActive"]);
        //db.createTable("localChanges", ["tableName", "action", "rowId"]);
        //db.createTable("authToken", ["token"]);
        
        db.commit();
        console.log("new empty tables have been created");
        overviewMessages.push("new empty tables have been created");
    }
    
    function dumpDB(db){
        var res = ""; 
        
        try {
            var expItems = db.queryAll("expenseItems");
            res += "[expenseItems]: " + expItems.length + "; "; 
            
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
        //var serverRows = serverDB.queryAll(tableName);
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

    function syncTable2(tableName, serverDB, localDB){
        //overviewMessages.push("table [" + tableName + "] sync has started");
        var resDB = serverDB;
        var index = 0; 
        
        var localRows = localDB.queryAll(tableName);
        
        for (index = 0; index < localRows.length; ++index) {
            var r = serverDB.queryAll(tableName, { query: { ID: localRows[index].ID }});      
            if (r.length == 0){
                resDB.insert(tableName, localRows[index]);
            }
            else if (localRows[index].changeDate > r[0].changeDate){
                resDB.insertOrUpdate(tableName, { ID: localRows[index].ID }, localRows[index] );
            }
                
        }
        
        overviewMessages.push("table [" + tableName + "] synced");
        
            
        return resDB;
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
                //var newId =
                resDB.insert(tableName, newRows[index]);
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
        
        
        // update server db rows, which were updated 
        var updatedRows = localDB.queryAll("localChanges", { query: {tableName: tableName, action: "update"}});
        var u = 0; 
        for (index = 0; index < updatedRows.length; ++index){
            var updatedRow = localDB.queryAll(tableName, { query: {ID: updatedRows[index].rowId}})[0];
            if (updatedRows[index].rowId){
                resDB.insertOrUpdate(tableName, {ID: updatedRows[index].rowId}, updatedRow);
                u++; 
            }
        }
        if (u > 0) 
            overviewMessages.push("table [" + tableName + "] rows updated: " + u);
        
            
        return resDB;    
    } 
    
    function uploadDB1(dbName1, db1){
        var revision = "0";  
        
        $http({
            method: 'PUT',
            url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbName1 + "/",
            cache: false, 
            headers: { "Authorization": auth.token }  
        }).success(function(response) {
            revision = response.revision;
            overviewMessages.push(revision);
            var delta = {
                    "delta_id": "db update",
                    "changes": [{
                            "change_type": "set", 
                            "collection_id": "budget", 
                            "record_id": "jsondb",  
                            "changes": [{
                                    "change_type": "set", 
                                    "field_id": "data", 
                                    "value": {
                                        "type": "string",
                                        "string": db1.serialize(),
                                    }
                            }]
                    }] 
            };
 
            $http({
                method: "POST",
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbName1 + "/deltas/",
                data: delta,  
                headers: { "Authorization": auth.token, "If-Match": revision }
            }).success(function(response) {
            	overviewMessages.push("uploaded");
                syncStatus.status = 2; 
                webDBhash = hashCode(db1.serialize());
            }).error(errorHandler);
             
        }).error(errorHandler);
   	
        
    }
    
    function uploadDB(){
        uploadDB1(dbName, db);
    } 
    
    function syncFromWeb(){
        // TODO: to return promise
        if (auth.token && auth.token != ""){
            $http({
                method: "GET",
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbName + "/snapshot/",  
                headers: { "Authorization": auth.token }
            }).success(function(response) {
                var sWebDB = response.records.items[0].fields[0].value.string;
                
                //console.log("webdb: " + sWebDB);
                var webDB = new localStorageDB("web_" + dbName, localStorage);
                webDB.initFromObj(JSON.parse(sWebDB));
                //overviewMessages.push("webDB: " + dumpDB(webDB));
                webDBhash = hashCode(webDB.serialize()); 
                if (webDBhash != hashCode(db.serialize())){
                    syncStatus.status = 1; 
                    var newDB = webDB;
                    //newDB = syncTable("localChanges", newDB, db);
                    //newDB = syncTable("expenseItems", newDB, db);
                    newDB = syncTable2("expenseItems", newDB, db);
                    newDB = syncTable2("expenses", newDB, db);
                    newDB = syncTable2("income", newDB, db);
                    newDB = syncTable2("balance", newDB, db);
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
            .error(function(data, status, headers, config) {
                if (status == 404){
                    console.log("db [" + dbName + "] not found");
                    uploadDB();
                    console.log("uploaded");
                }
                else 
                    errorHandler(data, status, headers, config); 
            }); 
        }
        else {
             syncStatus.status = 0;
             overviewMessages.push("Чтобы синхронизировать БД, необходимо сначала авторизовать приложение в хранилище Яндекс");
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
    
    function setActiveExpenseItem(e) {
        for(var key in e) {
            if( e.hasOwnProperty(key) ) {
                activeExpenseItem[key] = e[key];
            }
        }
    }
    
    function initListOfDatabases() {
        var promise = $http({
            method: "GET",
            url: "https://cloud-api.yandex.net/v1/data/app/databases/",  
            headers: { "Authorization": auth.token }
        }).success(function(response) {
            //var list = response;
            //overviewMessages.push(list);
            databases.length = 0; 
            response["items"].forEach(function(item){
                databases.push(item.database_id); 
            });
            
            //overviewMessages.push(databases);
        }).error(errorHandler);
        
        return promise; 
    }
    
    function deleteDatabase(dbToDelete) {
        var promise = 
            $http({
                method: "DELETE",
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dbToDelete,  
                headers: { "Authorization": auth.token }
            }).success(function(response) {
                db.drop();
                var webDB = new localStorageDB("web_" + dbName, localStorage);
                webDB.drop(); 
                
                overviewMessages.push("database [" + dbToDelete + "] has been deleted");
            }).error(errorHandler);
        return promise; 
    }

    
    
    
    var init = function(isAutosync) {
        dbName = localStorage["dbName"];
        if (!dbName){
            dbName = "myBudgetDatabase"; //prompt("please enter new db name", "newDatabase");
            localStorage["dbName"] = dbName;
        } 
        
        
        db = new localStorageDB(dbName, localStorage);
        
        $http.get('www/js/myBudgetDatabase.json').success(function(data) {
            console.log("isNewDb: " + db.isNew());
            if (db.isNew()) {
                console.log("db has been loaded from template");
                db.initFromObj(data);
                db.commit();
            }
            
            auth.token = localStorage["authToken"];
            syncStatus.status = 0;
            if (isAutosync)
                syncFromWeb();
            
            initListOfDatabases();
            
            expenseItems = db.queryAll("expenseItems", {query: { isActive: true },  sort: [["orderNum", "ASC"]] });
            for (var i = 0; i < expenseItems.length; i++) {
                if (expenseItems[i].name){
                    setActiveExpenseItem(expenseItems[i]);
                    break; 
                }
            }; 
        });
              

        
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
    
    function getListOfDatabases(){
        return databases; 
    }
    
    var expenseItems = []; 
    var dbName = "";
    
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
    var databases = ["myBudgetDatabase"];
     
    
    var activeExpenseItem = { };
    
    return {
        getDB: function() { return db; },
        getActiveExpenseItem: function() { return activeExpenseItem; },
        setActiveExpenseItem: setActiveExpenseItem, 
        auth: auth, 
        overviewMessages: overviewMessages,
         
        getExpenseItems: function() { return expenseItems; },
        
        init: init, 
        sync: syncFromWeb, 
        getAuthToken: getAuthToken,
        getSyncStatus: getSyncStatus,
        
        initListOfDatabases: initListOfDatabases,
        getListOfDatabases: getListOfDatabases, 
        deleteDatabase: deleteDatabase,
        uploadDB1: uploadDB1 
        
    } 
     
        
        
 
}); 