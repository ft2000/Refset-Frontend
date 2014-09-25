export default Ember.Handlebars.makeBoundHelper(function(value)
{
	return value ? 'Yes' : 'No';
});