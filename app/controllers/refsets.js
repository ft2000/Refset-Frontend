export default Ember.ArrayController.extend({
	
	needs 	: ["login"],

	user 	: Ember.computed.alias("controllers.login.user"),
});
