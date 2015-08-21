angular.module('budget', ['ngRoute', 'budget.controllers', 'budget.services'])

    .config(['$routeProvider', '$locationProvider', 
        function($routeProvider, $locationProvider) {
        $routeProvider

            .when('/', {
                templateUrl : 'www/templates/web/test.html',
                controller  : 'TestCtrl'
            })
            
            .when('/budget/', {
                templateUrl : 'www/templates/web/test.html',
                controller  : 'TestCtrl'
            })
            
            .when('/budget/overview', {
                templateUrl : 'www/templates/web/overview.html',
                controller  : 'OverviewCtrl'
            })

            .when('/budget/expenses', {
                templateUrl : 'www/templates/web/expenses.html',
                controller  : 'ExpensesCtrl'
            })
            
            .when('/budget/expensesPlan', {
                templateUrl : 'www/templates/web/expensesPlan.html',
                controller  : 'ExpensesPlanCtrl'
            })
            
            .when('/budget/income', {
                templateUrl : 'www/templates/web/income.html',
                controller  : 'IncomeCtrl'
            })
            .when('/budget/balance', {
                templateUrl : 'www/templates/web/balance.html',
                controller  : 'BalanceCtrl'
            })

            .when('/budget/plan', {
                templateUrl : 'www/templates/web/plan.html',
                controller  : 'PlanCtrl'
            });
            
         $locationProvider.html5Mode(true);
    }])
    .directive('autoFocus', function($timeout) {
        return {
            restrict: 'AC',
            link: function(_scope, _element) {
                $timeout(function(){
                    _element[0].focus();
                    _element[0].select();
                }, 0);
            }
        };
    })
    .run(function (dataService) {
        dataService.init(); 
    })
    
    ;



    
angular.module('budget.controllers', []);
angular.module('budget.services', []);

