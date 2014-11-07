export default Ember.Route.extend({
        		
	beforeModel : function(params)
	{
		this.controllerFor('refsets/refset').initModel(params);
	},

});