angular.module('budget', ['ngRoute', 'budget.controllers', 'budget.services'])

    .config(['$routeProvider', '$locationProvider', 
        function($routeProvider, $locationProvider) {
        $routeProvider

            .when('/', {
                templateUrl : 'www/templates/web/test.html',
                controller  : 'TestCtrl'
            })
            
            .when('/overview', {
                templateUrl : 'www/templates/web/overview.html',
                controller  : 'OverviewCtrl'
            })

            .when('/expenses', {
                templateUrl : 'www/templates/web/expenses.html',
                controller  : 'ExpensesCtrl'
            })
            
            .when('/expensesPlan', {
                templateUrl : 'www/templates/web/expensesPlan.html',
                controller  : 'ExpensesPlanCtrl'
            })
            
            .when('/income', {
                templateUrl : 'www/templates/web/income.html',
                controller  : 'IncomeCtrl'
            })
            .when('/balance', {
                templateUrl : 'www/templates/web/balance.html',
                controller  : 'BalanceCtrl'
            })

            .when('/plan', {
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

