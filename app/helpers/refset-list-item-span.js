export default Ember.Handlebars.makeBoundHelper(function(classname,value,concepts)
{
	if (typeof value !== "undefined" && typeof concepts !== "undefined")
	{
		if (typeof concepts[value] !== "undefined")
		{
			return new Handlebars.SafeString('<span class="' + classname + '" rel="tooltip" title="' + concepts[value] + '">' + value + '</span>');
		}
		else
		{
			return new Handlebars.SafeString('<span class="' + classname + '">' + value + '</span>');
		}
	}
});