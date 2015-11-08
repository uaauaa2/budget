// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('budget', ['ionic', 'budget.controllers', 'budget.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  $stateProvider

  /*.state('tab1', {
    url: '/tab1',
    abstract: true,
    templateUrl: 'templates/mobile/expenses.html',  
    controller: 'HeaderCtrl'
  })*/
    
      
      .state('home', {
        url: '/home',
        templateUrl: 'templates/mobile/home.html',
        controller: 'ExpensesCtrl'
      })
      
      .state('select2', {
        url: '/select2',
        templateUrl: 'templates/mobile/selectExpenseItem.html',
        controller: 'SelectExpenseItemCtrl'
      })
      .state('overview2', {
        cache: false,
        url: '/overview2',
        templateUrl: 'templates/mobile/overview.html',
        controller: 'OverviewCtrl'
      })
    

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/mobile/tabs.html',  
    controller: 'HeaderCtrl'
  })

  // Each tab has its own nav history stack:

  .state('tab.overview', {
    cache: false,
    url: '/overview',
    views: {
      'tab-overview': {
        templateUrl: 'templates/mobile/overview.html',
        controller: 'OverviewCtrl'
      }
    }
  })
  
  .state('tab.expenses', {
    abstract: true,
    url: '/expenses',
    views: {
      'tab-expenses': {
        template: '<ion-nav-view></ion-nav-view>'
      }
    }
  })
  
  .state('tab.expenses.index', {
    url: '',
    templateUrl: 'templates/mobile/expenses.html',
    controller: 'ExpensesCtrl'
  })
  
  .state('tab.expenses.select', {
    url: '/select',
    templateUrl: 'templates/mobile/selectExpenseItem.html',
    controller: 'SelectExpenseItemCtrl'
  })
  
 ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/home');

})

.run(function (dataService) {
        dataService.init(); 
})


;

angular.module('budget.controllers', []);
angular.module('budget.services', []);

  
     



