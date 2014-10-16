export default Ember.Handlebars.makeBoundHelper(function(value)
{
	switch (value)
	{
		case "en_US" : return "US English"; 
	}
});