export default Ember.Handlebars.makeBoundHelper(function(date) {
	
	return $.formatDateTime('MM dd, yy', new Date(date));
});