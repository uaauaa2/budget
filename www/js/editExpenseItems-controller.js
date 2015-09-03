  
angular.module('budget.controllers').controller("EditExpenseItemsCtrl", function($scope, dataService) {
    $scope.db = dataService.getDB();  
    $scope.newExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
    if ($scope.newExpenseItems.length == 0){
        $scope.newExpenseItems.push({ levelNum: 1, title: "Total" }); 
    }
    //alert(JSON.stringify($scope.newExpenseItems[3]));
    $scope.errorList = [];     
    
    $scope.moveLeft = function(e){
        if(e.levelNum > 1){
            e.levelNum--; 
        }
    }
    
    $scope.moveRight = function(e){
        if(e.levelNum < 4){
            e.levelNum++; 
        }
    }
    
    $scope.moveVertically = function(e, isUp){
        var i = $scope.newExpenseItems.indexOf(e);
        $scope.newExpenseItems.splice(i, 1);
        if (isUp){
            if (i > 0)
                i--; 
        }
        else { 
            i++;
        }
        $scope.newExpenseItems.splice(i, 0, e);
    }
    
    $scope.add = function(e){
        var i = $scope.newExpenseItems.indexOf(e);
        var o = { levelNum: e.levelNum, title: "", name: ""}; 
        $scope.newExpenseItems.splice(i + 1, 0, o);
    }
    
    $scope.del = function(e){
        var i = $scope.newExpenseItems.indexOf(e);
        $scope.newExpenseItems.splice(i, 1);
    }
    
    
    
    $scope.verify = function(){
        var res = true;
        $scope.errorList = [];
        if ($scope.newExpenseItems[0].levelNum != 1){
            $scope.errorList.push("first item should have levelNum = 1");
            res = false; 
        }
        
        var newl = $scope.newExpenseItems.length;
        var index = 0; 
        for (index = 0; index < newl; index++){
            if (!$scope.newExpenseItems[index].title || ($scope.newExpenseItems[index].title && $scope.newExpenseItems[index].title == "")){
                $scope.errorList.push("'title' is mandatory field: " + JSON.stringify($scope.newExpenseItems[index]));
                    res = false;
            }
            
            if (index > 0){ // if it's not the first item
                if ($scope.newExpenseItems[index].levelNum == 1){
                    $scope.errorList.push("there could be only one levelNum == 1 item: " + JSON.stringify($scope.newExpenseItems[index]));
                    res = false;
                }
                 
                if ($scope.newExpenseItems[index].levelNum - $scope.newExpenseItems[index-1].levelNum > 1){ // previous item should have the same levelNum or levelNum + 1
                    $scope.errorList.push("each item should have a parent: " + JSON.stringify($scope.newExpenseItems[index]));
                    res = false;  
                }
                
                if ($scope.newExpenseItems[index-1].hasOwnProperty("name") 
                    && $scope.newExpenseItems[index-1].name != "" 
                    && $scope.newExpenseItems[index-1].name != null){ // if previous item has attribute 'name' 
                        if ($scope.newExpenseItems[index].levelNum - $scope.newExpenseItems[index-1].levelNum > 0){ // current item shouldn't be a child of previous
                            $scope.errorList.push("items with attribute 'name' shouldn't have chilren: " + JSON.stringify($scope.newExpenseItems[index-1]));
                            res = false; 
                        }
                }
            } 
        } 
        
        var oldExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
        var oldl = oldExpenseItems.length;
        var exists; 
        for (var oldIndex = 0; oldIndex < oldl; oldIndex++){
            var oldId = oldExpenseItems[oldIndex].ID;
            exists = false;  
            for (var newIndex = 0; newIndex < newl; newIndex++){
                if (oldId == $scope.newExpenseItems[newIndex].ID){
                    exists = true; 
                }
            }
            if (!exists){
                var amount = $scope.getTotalByExpenseItem(oldExpenseItems[oldIndex]); 
                if (amount > 0){ 
                    $scope.errorList.push("item cannot be deleted, total amount: " + amount + "; " + JSON.stringify(oldExpenseItems[oldIndex]));
                    res = false; 
                }
            }        
        }

        return res; 
    }
    
    $scope.save = function(){
        var isListOK = $scope.verify();
        console.log("is list ok: " + isListOK);
        if (isListOK){
            var newl = $scope.newExpenseItems.length;
            // deleting
            var oldExpenseItems = $scope.db.queryAll("expenseItems", { sort: [["orderNum", "ASC"]] });
            var oldl = oldExpenseItems.length;

            var exists; 
            for (var oldIndex = 0; oldIndex < oldl; oldIndex++){
                var oldId = oldExpenseItems[oldIndex].ID;
                exists = false;  
                for (var newIndex = 0; newIndex < newl; newIndex++){
                    if (oldId == $scope.newExpenseItems[newIndex].ID){
                        exists = true; 
                        break;
                    }
                }
                if (!exists){
                    $scope.db.deleteRows("expenseItems", {ID: oldId}); 
                    $scope.db.insert("localChanges", { tableName: "expenseItems", action: "delete", rowId: oldId });
                }        
            }
            
            var newId; //debugger;
            // adding
            for (var index = 0; index < newl; index++){
                if (!($scope.newExpenseItems[index].name) || ($scope.newExpenseItems[index].name && $scope.newExpenseItems[index].name == ""))
                    $scope.newExpenseItems[index].name = null; 
                    
                if ($scope.newExpenseItems[index].hasOwnProperty('ID') && $scope.newExpenseItems[index].ID != null){
                    $scope.db.insertOrUpdate("expenseItems", { ID: $scope.newExpenseItems[index].ID }, { 
                                                       levelNum: $scope.newExpenseItems[index].levelNum, 
                                                       title: $scope.newExpenseItems[index].title, 
                                                       name: $scope.newExpenseItems[index].name });
                    console.log("[" + $scope.newExpenseItems[index].name + "]"); 
                    $scope.db.insert("localChanges", { tableName: "expenseItems", action: "update", rowId: $scope.newExpenseItems[index].ID });
                    //alert("updated id: " + $scope.newExpenseItems[index].ID);
                }
                else {
                    newId = $scope.db.insert("expenseItems", { levelNum: $scope.newExpenseItems[index].levelNum, 
                                                       title: $scope.newExpenseItems[index].title, 
                                                       name: $scope.newExpenseItems[index].name });
                    $scope.newExpenseItems[index].ID = newId;
                }
            }
            
            // updating orderNum and idsForTotal
            var idListForTotal;
            for (index = 0; index < newl; index++ ){
                idListForTotal = [];
                if ($scope.newExpenseItems[index].name)
                    idListForTotal.push($scope.newExpenseItems[index].ID); 
                var currentLevel = $scope.newExpenseItems[index].levelNum; 
                for (var j = index + 1; j < newl; j++){
                    if ($scope.newExpenseItems[j].levelNum - currentLevel > 0){
                        if ($scope.newExpenseItems[j].name)
                            idListForTotal.push($scope.newExpenseItems[j].ID);
                    } 
                    else 
                        break; 
                }

                console.log($scope.newExpenseItems[index].ID + ": " + idListForTotal);                
                $scope.db.update("expenseItems", { ID: $scope.newExpenseItems[index].ID }, function(row){
                    row.orderNum = index + 1;
                    row.idListForTotal = idListForTotal;
 
                    return row; 
                } ); 
            }
            
            
            $scope.db.commit();
            console.log("done");
        }
        
    }
    
    $scope.getTotalByExpenseItem = function(expenseItem){
        var result = $scope.db.queryAll("expenses", { 
            query: function(row) {
                if (expenseItem.idListForTotal.indexOf(row.expenseItemId) >= 0) {
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

});

