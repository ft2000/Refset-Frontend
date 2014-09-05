export default Ember.ArrayController.extend({
	
	model : 
	[
    ],
    
    actions :
    {
		uploadMemberList : function(members)
		{
			var membersArray = members.split('\n');
			var counter = 0;
			
			var membersData = membersArray.map(function(id)
			{
				return {id:id,description: "member " + counter++};
			});
			
			this.model.setObjects(membersData);
		}
    }
});
