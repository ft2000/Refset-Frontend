export default Ember.Handlebars.makeBoundHelper(function(sortBy, sortOrder, thisField)
{
	if (sortBy === thisField)
	{
		var icon = 'upArrow.png';
		
		switch (sortOrder)
		{
			case 'desc' 	: {icon='downArrow.png'; break; } 
			case 'score' 	: {icon='search.png'; break; } 
		}
		
		return new Handlebars.SafeString('<img src="/assets/img/' + icon + '">');
	}
});