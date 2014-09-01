import Ember from 'ember';

var Router = Ember.Router.extend({
  location: RefsetENV.locationType
});

Router.map(function() {
	  this.resource("dashboard",{path:'/'});
	  this.resource("tools", function(){
		  this.resource("refsets", function(){
			  this.route("refset", {path:':refset_id'});
		  });
	  });

	  this.resource("news");
	  this.resource("privacy-statement");
	  this.resource("cookie-policy");
	  this.resource("accessibility");
	  this.resource("terms-and-conditions");
	  this.resource("site-map");
});

export default Router;