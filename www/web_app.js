angular.module('budget', ['ui.router', 'budget.controllers', 'budget.services'])

    .config(['$stateProvider', '$urlRouterProvider', 
        function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/index');
        $stateProvider
        
            .state('index', {
                url: '/index',
                //templateUrl : 'budget/www/templates/web/expenses.html',
                templateUrl : 'www/templates/web/expenses.html',
                controller  : 'ExpensesCtrl'
            })
            
            .state('expensesTable', {
                //templateUrl : 'budget/www/templates/web/expensesTable.html',
                templateUrl : 'www/templates/web/expensesTable.html',
                controller  : 'ExpensesTableCtrl'
            })

            .state('expenses', {
                //templateUrl : 'budget/www/templates/web/expenses.html',
                templateUrl : 'www/templates/web/expenses.html',
                controller  : 'ExpensesCtrl'
            })
            
            .state('income', {
                //templateUrl : 'budget/www/templates/web/income.html',
                templateUrl : 'www/templates/web/income.html',
                controller  : 'IncomeCtrl'
            })
            
            .state('expensesPlan', {
                //templateUrl : 'budget/www/templates/web/expensesPlan.html',
                templateUrl : 'www/templates/web/expensesPlan.html',
                controller  : 'ExpensesPlanCtrl'
            })
            
            .state('balance', {
                //templateUrl : 'budget/www/templates/web/balance.html',
                templateUrl : 'www/templates/web/balance.html',
                controller  : 'BalanceCtrl'
            })
            
            .state('editExpenseItems', {
                //templateUrl : 'budget/www/templates/web/editExpenseItems.html',
                templateUrl : 'www/templates/web/editExpenseItems.html',
                controller  : 'EditExpenseItemsCtrl'
            })

            .state('settings', {
                //templateUrl : 'budget/www/templates/web/settings.html',
                templateUrl : 'www/templates/web/settings.html',
                controller  : 'SettingsCtrl'
            })
            
            .state('plan', {
                //templateUrl : 'budget/www/templates/web/plan.html',
                templateUrl : 'www/templates/web/plan.html',
                controller  : 'PlanCtrl'
            })
            
            .state('about', {
                //templateUrl : 'budget/www/templates/web/about.html',
                templateUrl : 'www/templates/web/about.html'
            })
            
            ;
         
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
        var isAutosync = true; 
        dataService.init(isAutosync); 
    })
    
    ;



    
angular.module('budget.controllers', []);
angular.module('budget.services', []);

