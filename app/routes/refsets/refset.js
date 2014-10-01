export default Ember.Route.extend({
        		
	beforeModel : function(params)
	{
		var _this 	= this;
		var id 		= params.params["refsets.refset"].id;
		
		Ember.Logger.log("routes.refsets.refset:beforeModel (id)",id);
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function(){_this.controllerFor('data').getRefset(id);});
	},

});