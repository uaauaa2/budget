angular.module('budget', ['ngRoute', 'budget.controllers', 'budget.services'])

    .config(['$routeProvider', '$locationProvider', 
        function($routeProvider, $locationProvider) {
        $routeProvider

            .when('/', {
                templateUrl : 'budget/www/templates/web/test.html',
                controller  : 'TestCtrl'
            })
            
            .when('/budget/', {
                templateUrl : 'budget/www/templates/web/test.html',
                controller  : 'TestCtrl'
            })
            
            .when('/budget/overview', {
                templateUrl : 'budget/www/templates/web/overview.html',
                controller  : 'OverviewCtrl'
            })

            .when('/budget/expenses', {
                templateUrl : 'budget/www/templates/web/expenses.html',
                controller  : 'ExpensesCtrl'
            })
            
            .when('/budget/expensesPlan', {
                templateUrl : 'budget/www/templates/web/expensesPlan.html',
                controller  : 'ExpensesPlanCtrl'
            })
            
            .when('/budget/income', {
                templateUrl : 'budget/www/templates/web/income.html',
                controller  : 'IncomeCtrl'
            })
            .when('/budget/balance', {
                templateUrl : 'budget/www/templates/web/balance.html',
                controller  : 'BalanceCtrl'
            })

            .when('/budget/plan', {
                templateUrl : 'budget/www/templates/web/plan.html',
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

