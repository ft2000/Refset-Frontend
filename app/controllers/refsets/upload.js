import MembersAdapter 	from '../../adapters/simple-members';

var membersAdapter = MembersAdapter.create();

export default Ember.ArrayController.extend({
	
	needs : ["login"],
	
	model : 
	[
    ],

	clearMemberList : function()
	{
		this.model.setObjects([]);
	},
	
	getConceptDataInProgress : false,
	
    actions :
    {
		uploadMemberList : function(members)
		{
			var _this = this;
			var membersArray = members.split('\n');
			
			var idArray = membersArray.map(function(refCompId)
			{
				return refCompId;
			});

			var loginController = this.get('controllers.login');
			var user = loginController.user;
			
			Ember.Logger.log("controllers.refsets.upload:actions:uploadMemberList (idArray)",idArray);

			this.set("getConceptDataInProgress",true);
			
			var membersData = membersAdapter.findList(user,idArray).then(function(conceptData)
			{
				var membersData = membersArray.map(function(refCompId)
				{
					return {referenceComponentId:refCompId,description: conceptData[refCompId].label};
				});	
				
				_this.model.setObjects(membersData);

				_this.set("getConceptDataInProgress",false);
				return membersData;
			});
			
			Ember.Logger.log("controllers.refsets.upload:actions:uploadMemberList (membersData)",membersData);
			
		},
    }
});