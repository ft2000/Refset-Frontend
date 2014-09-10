export default Ember.ArrayController.extend({
	
	model : 
	[
    ],

	clearMemberList : function()
	{
		this.model.setObjects([]);
	},
	
    actions :
    {
		uploadMemberList : function(members)
		{
			var membersArray = members.split('\n');
			var counter = 0;
			
			var membersData = membersArray.map(function(refCompId)
			{
				return {referenceComponentId:refCompId,description: "member " + counter++};
			});
			
			Ember.Logger.log("controllers.refsets.upload:actions:uploadMemberList (membersData)",membersData);
			
			this.model.setObjects(membersData);
		},
    }
});
