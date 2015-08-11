angular.module('budget', ['ngRoute', 'budget.controllers'])

    .config(['$routeProvider', '$locationProvider', 
        function($routeProvider, $locationProvider) {
        $routeProvider

            .when('/', {
                templateUrl : 'templates/web/overview.html',
                controller  : 'OverviewCtrl'
            })

            .when('/expenses', {
                templateUrl : 'templates/web/expenses.html',
                controller  : 'ExpensesCtrl'
            })
            
            .when('/expensesPlan', {
                templateUrl : 'templates/web/expensesPlan.html',
                controller  : 'ExpensesPlanCtrl'
            })
            
            .when('/income', {
                templateUrl : 'templates/web/income.html',
                controller  : 'IncomeCtrl'
            })
            .when('/balance', {
                templateUrl : 'templates/web/balance.html',
                controller  : 'BalanceCtrl'
            })

            .when('/plan', {
                templateUrl : 'templates/web/plan.html',
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
    .service('dataService', function () {
        this.dbName = "budget2015";
        this.db = null;
    });



    
angular.module('budget.controllers', []);

angular.module('budget.controllers').controller('aboutController', function($scope) {
    $scope.message = 'Look! I am an about page.';
});

angular.module('budget.controllers').controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
}); 