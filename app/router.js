import Ember from 'ember';

var Router = Ember.Router.extend({
  location: RefsetENV.locationType
});

Router.map(function() {
	  this.route("dashboard",{path:'/'});
	  
	  this.resource("refsets", function(){
		  this.route("refset", {path:':id'});
		  this.route("new");
	  });

	  this.route("news");
	  this.route("privacy-statement");
	  this.route("cookie-policy");
	  this.route("accessibility");
	  this.route("terms-and-conditions");
	  this.route("site-map");
	  
	  //this.route('catchall', {path: '/*wildcard'});
});

export default Router;