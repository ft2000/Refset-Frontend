var concepts = {
		
		'446609009z' : 'Simple type reference set',
		'900000000000496009' : 'Simple map type reference set',
		'900000000000461009' : 'Concept type components',
		'900000000000464001' : 'Reference set member type component'
};

export default Ember.Handlebars.makeBoundHelper(function(id)
{
	Ember.Logger.log("helpers.id-to-name:id",id);
	
	if (typeof id === "undefined")
	{
		return ""; // Not actually got any ID. It's just Ember trying to render an empty model
	}
		
	if (typeof concepts[id] === "undefined")
	{
		var dataController = this.get('controllers.data');
		
		concepts[id] = dataController.getMember(id).then(function(response)
		{
			if (typeof response.label !== 'undefined')
			{
				concepts[id] = response.label.replace(/ *\([^)]*\) */g, "");
				return concepts[id];
			}
			else
			{
				return 'unknown';
			}	
		});
		
		return concepts[id];
	}
	else
	{
		return concepts[id];
	}
});