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

Ember.Route.reopen({
	  getParentRoute: function(){
	    var route = this;
	    var handlerInfos = route.router.router.currentHandlerInfos;
	    var parent, current;

	    for (var i=0, l=handlerInfos.length; i<l; i++) {
	      current = handlerInfos[i].handler;
	      if((current.routeName === route.routeName)||(current.routeName.match(/./) && current.routeName.split('.')[1] === route.routeName )){
	        return parent.routeName;
	      }
	      parent = current;
	    }
	  }
	});
	
export default Router;