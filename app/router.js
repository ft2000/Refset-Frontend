import Ember from 'ember';

var Router = Ember.Router.extend({
  location: RefsetENV.locationType
});

Router.map(function() {
	  this.route("dashboard",{path:'/'});
	  this.route("tools");
	  this.route("news");

	  this.route("privacy-statement");
	  this.route("cookie-policy");
	  this.route("accessibility");
	  this.route("terms-and-conditions");
	  this.route("site-map");

	  this.resource("refsets",{path:'/r/'});
});

export default Router;
