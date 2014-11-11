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
    	thisApplicationName 			: 'Refset',
    	RegistrationEmail 				: 'register@ihtsdo.org',

    	//User authentication
        authenticationActionSoapName	: 'getUserByNameAuth',
        authenticationUrl				: 'https://usermanagement3.ihtsdotools.org/security-web/query',
        appsUrl							: 'https://usermanagement3.ihtsdotools.org/security-web/query/users/__USER_ID__/apps',
        permissionsUrl					: 'https://usermanagement3.ihtsdotools.org/security-web/query/users/__USER_ID__/apps/Refset',
        passwordResetURL				: 'https://usermanagement3.ihtsdotools.org/requestPwChange.jsp',
    	
    	// Refsets API
        refsetApiBaseUrl				: 'http://refset.ihtsdotools.org:8080/refset/v1.0/refsets',
        conceptsApiBaseUrl				: 'http://refset.ihtsdotools.org:8080/refset/v1.0/snomed/concepts',
        snomedTypesApiBaseUrl 			: 'http://refset.ihtsdotools.org:8080/refset/v1.0/snomed/',
        
        numItemsPerPage 				: 10,
        numItemsPerPageDashboard 		: 5,
        
        supportedSnomedTypes :
        {
        	refsetTypes 				: ['446609009','900000000000496009'],
        	componentTypes 				: ['900000000000461009','900000000000462002']
        },
        
        defaultSnomedTypes :
        {
        	refsetType 					: '446609009',
        	componentType 				: '900000000000461009',
        	moduleType 					: '900000000000207008',
        },
        
        loginExpiry 					: 20, // minutes before you are logged out
        },
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
    
    ENV.APP.refsetApiBaseUrl				= 'http://refset.ihtsdotools.org:8080/refset/v1.0/refsets';
    ENV.APP.conceptsApiBaseUrl				= 'http://refset.ihtsdotools.org:8080/refset/v1.0/snomed/concepts';
    ENV.APP.snomedTypesApiBaseUrl 			= 'http://refset.ihtsdotools.org:8080/refset/v1.0/snomed/';
  }

  if (environment === 'production') {
    ENV.APP.refsetApiBaseUrl				= 'http://refsetprod.ihtsdotools.org:8080/refset/v1.0/refsets';
    ENV.APP.conceptsApiBaseUrl				= 'http://refsetprod.ihtsdotools.org:8080/refset/v1.0/snomed/concepts';
    ENV.APP.snomedTypesApiBaseUrl 			= 'http://refsetprod.ihtsdotools.org:8080/refset/v1.0/snomed/';
  }

  return ENV;
};
