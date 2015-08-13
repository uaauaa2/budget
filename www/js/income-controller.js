angular.module('budget.controllers').controller('IncomeCtrl', function($scope, dataService, $http) {
    $scope.incomeIsPlan = false; 
    $scope.incomeDate = new Date();
    $scope.incomeAgent = "Костя"; 
    $scope.incomeAmount = null; 
    $scope.incomeComment = ""; 
     
    //$scope.allIncome = [{isPlan: false, date: "2015-07-01", agent: "Костя", amount: 100000, comment: ""}];
    
    $scope.init = function(){
        $scope.allIncome = dataService.db.queryAll("income");
    }
    
    $scope.init(); 
    
    
    $scope.add = function() {
        $scope.allIncome.push( {
              isPlan: $scope.incomeIsPlan,
              date: $scope.incomeDate, 
              agent: $scope.incomeAgent,
              amount: parseInt($scope.incomeAmount),
              comment: $scope.incomeComment
            }
        );  
        dataService.db.insert("income", {
                isPlan: $scope.incomeIsPlan,
                date: $scope.incomeDate.yyyy_mm_dd(), 
                agent: $scope.incomeAgent,
                amount: parseInt($scope.incomeAmount),
                comment: $scope.incomeComment
            }
        );
        dataService.db.commit();
    };
    
    $scope.del = function(b) {
        var i = $scope.allIncome.indexOf(b);
        $scope.allIncome.splice(i, 1);
        dataService.db.deleteRows("income", { ID: b.ID } );
        dataService.db.insert("localChanges", { tableName: "income", action: "delete", rowId: b.ID });
        dataService.db.commit(); 
    };
    
    $scope.uploadDB = function(){
        var revision = "0";  
        var tokenRes = dataService.db.queryAll("authToken"); 
        var authToken = "";    
        if (tokenRes.length > 0){
                authToken = tokenRes[0].token;
        }
        if (authToken != ""){   
            $http({
                method: 'PUT',
                url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/",
                headers: { "Authorization": authToken }  
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
                //alert($scope.db.serialize());
                //alert(JSON.stringify(delta)); 
                $http({
                    method: "POST",
                    url: "https://cloud-api.yandex.net/v1/data/app/databases/" + dataService.dbName + "/deltas/",
                    data: delta,  
                    headers: { "Authorization": authToken, "If-Match": revision }
                }).success(function(response) {
                    alert("uploaded")
                }).error($scope.errorHandler);
                 
            }).error($scope.errorHandler);
        }
        else 
            alert("authToken missing"); 
        
    } 
    
    
  
});