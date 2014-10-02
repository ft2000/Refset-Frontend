export default Ember.Handlebars.makeBoundHelper(function(value,concepts)
{
	if (typeof value !== "undefined" && typeof concepts !== "undefined")
	{
		if (typeof concepts[value] !== "undefined")
		{
			return concepts[value].replace(/ *\([^)]*\) */g, "");
		}
		else
		{
			return value + ' not found';
		}
	}
});
