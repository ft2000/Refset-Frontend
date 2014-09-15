/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    environment: environment,
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    	thisApplicationName : 'Refset',
    	RegistrationEmail : 'register@ihtsdo.org',

    	//User authentication
        authenticationActionSoapName: 'getUserByNameAuth',
        authenticationUrl: 'https://usermanagement.ihtsdotools.org/security-web/query/',
        appsUrl: 'https://usermanagement.ihtsdotools.org/security-web/query/users/__USER_ID__/apps',
        permissionsUrl: 'https://usermanagement.ihtsdotools.org/security-web/query/users/__USER_ID__/apps/Refset',
        passwordResetURL: 'https://usermanagement.ihtsdotools.org/security-web/requestPwChange.jsp',
    	
    	// Refsets API
        refsetApiBaseUrl: 'http://content.ihtsdotools.org:8080/refset/v1.0/refsets',
        conceptsApiBaseUrl: 'http://content.ihtsdotools.org:8080/refset/v1.0/snomed/concepts',
        
        numItemsPerPage : 10,
        numItemsPerPageDashboard : 5,
        
        loginExpiry : 20, // minutes before you are logged out
        }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    ENV.baseURL = '/'; // Testem prefers this...
  }

  if (environment === 'production') {

  }

  return ENV;
};
