export default Ember.Handlebars.makeBoundHelper(function(member)
{
	var theDate1 	= new Date(member.created);
	var theDate2 	= new Date(member.modifiedDate);
	var createdDate;
	var updateDate;
	
	if (theDate1 instanceof Date && !isNaN(theDate1.valueOf()))
	{	
		createdDate = $.formatDateTime('hh:ii - MM dd, yy', theDate1);
	}

	if (theDate2 instanceof Date && !isNaN(theDate2.valueOf()))
	{	
		updateDate = $.formatDateTime('hh:ii - MM dd, yy', theDate2);
	}

	var tooltip	= "Created: " + createdDate + ", Last Updated: " + updateDate + ", by: " + member.modifiedBy;
	var anchor 	= '<a class="pointer icon info" rel="tooltip" title="' + tooltip + '"></a>';
	
	return new Handlebars.SafeString(anchor);
});