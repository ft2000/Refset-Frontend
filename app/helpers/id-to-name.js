import MembersAdapter 	from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

var concepts = {
		
		'446609009' : 'Simple type reference set',
		'900000000000496009' : 'Simple map type reference set',
		'900000000000461009' : 'Concept type components',
		'900000000000464001' : 'Reference set member type component'
};

export default Ember.Handlebars.makeBoundHelper(function(id)
{
	if (typeof concepts[id] === "undefined")
	{
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		var result = membersAdapter.find(user,id);
		var memberObj;
		
		var result = Ember.RSVP.Promise.all([result]).then(function(resultObj)
		{
			Ember.Logger.log("resultObj",resultObj);
			
			if (resultObj.status === "OK")
			{
				memberObj = resultObj.data;
				Ember.Logger.log("memberObj",memberObj);

				concepts[id] = memberObj.label.replace(/ *\([^)]*\) */g, "");
			}
			else
			{
				return 'unknown';
			}
		});
		
		return result;
	}
	else
	{
		return concepts[id];
	}
});