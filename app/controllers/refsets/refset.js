export default Ember.ObjectController.extend({
		
	needs : ["login","data"],
	
	model : Ember.computed.alias("controllers.data.refset"),

});
