export default Ember.Handlebars.makeBoundHelper(function(date)
{
	var theDate = new Date(date);
	
	if (theDate instanceof Date && !isNaN(theDate.valueOf()))
	{
		return $.formatDateTime('yymmdd', theDate);		
	}
	else
	{
		return 'undefined';
	}
});