/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp();

var mergeTrees = require('broccoli-merge-trees');
var pickFiles = require('broccoli-static-compiler');

// Use `app.import` to add additional libraries to the generated
// output files.
//
// If you need to use different assets in different
// environments, specify an object as the first parameter. That
// object's keys should be the environment name and the values
// should be the asset to use in that environment.
//
// If the library that you are including contains AMD or ES6
// modules that you would like to import into your application
// please specify an object with the list of modules as keys
// along with the exports of each module as its value.

//Bootstrap Stuff
app.import('vendor/bootstrap/dist/js/bootstrap.min.js');
app.import('vendor/bootstrap/dist/css/bootstrap.min.css');
app.import('vendor/bootstrap/dist/css/bootstrap-theme.min.css');

app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-core.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-basic.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-alert.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-growl-notifications.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/css/bs-growl-notifications.min.css');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-modal.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-button.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-breadcrumbs.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-popover.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-badge.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-list-group.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-nav.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-notifications.min.js');
app.import('vendor/ember-addons.bs_for_ember/dist/js/bs-progressbar.min.js');

//Bootstrap Modal
app.import('vendor/bootstrap3-dialog/dist/js/bootstrap-dialog.min.js');
app.import('vendor/bootstrap3-dialog/dist/css/bootstrap-dialog.min.css');

//Bootstrap Switch
app.import('vendor/bootstrap-switch-master/dist/js/bootstrap-switch.min.js');
app.import('vendor/bootstrap-switch-master/dist/css/bootstrap3/bootstrap-switch.min.css');

//Moment (date functions)
app.import('vendor/moment/min/moment.min.js');

// JQuery plugins
app.import('vendor/jquery.formatDateTime-master/dist/jquery.formatDateTime.min.js');

// Ember forms
app.import('vendor/ember-forms/dist/globals/main.js');

// File saver
app.import('vendor/fileSaver/FileSaver.min.js');

// File Upload
app.import('vendor/my_utilities/drag_drop_file_upload.js');

// Session Store
app.import('vendor/my_utilities/sessvars-1.0.0-min.js');
app.import('vendor/my_utilities/sessionStoreManager-1.0.0-min.js');

// Bootstrap Date Picker
app.import('vendor/bootstrap-datepicker-release/js/bootstrap-datepicker.js');
app.import('vendor/bootstrap-datepicker-release/css/datepicker3.css');

// Bootstrap fonts
var fontOpenSans = pickFiles('vendor/bootstrap/dist', {
	   srcDir: '/',
	   files: ['**/*.woff', '**/*.eot', '**/*.svg', '**/*.ttf'],
	   destDir: '/'
	});

//module.exports = app.toTree();
module.exports = mergeTrees([app.toTree(), fontOpenSans]);