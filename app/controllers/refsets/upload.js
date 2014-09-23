import MembersAdapter 	from '../../adapters/simple-members';

var membersAdapter = MembersAdapter.create();

export default Ember.ArrayController.extend({
	
	needs : ["login"],
	
	model : [],
    
    importError : null,

	clearMemberList : function()
	{
		this.model.setObjects([]);
	},
	
	getConceptDataInProgress : false,

	
	clearMembers : function()
	{
		this.model.setObjects([]);
	},
	
    actions :
    {
		uploadMemberList : function(members)
		{
			var _this = this;
			var membersArray = members.split('\n');
			
			var idArray = membersArray.map(function(refCompId)
			{
				if (refCompId !== "")
				{
					return refCompId;
				}
			});
			
			idArray = $.grep(idArray,function(n){ return(n) });

			var loginController = this.get('controllers.login');
			var user = loginController.user;
			
			this.set("getConceptDataInProgress",true);
			
			var membersData = membersAdapter.findList(user,idArray).then(function(result)
			{
				var membersData2;
				
				if (result.status)
				{
					var conceptData = result.data;
					
					membersData2 = idArray.map(function(refCompId)
					{
						Ember.Logger.log("refCompId",refCompId,conceptData);
						
						if (conceptData[refCompId] !== null)
						{
							return {referenceComponentId:refCompId,description: conceptData[refCompId].label, active:conceptData[refCompId].active, found:true, disabled:!conceptData[refCompId].active};
						}
						else
						{
							return {referenceComponentId:refCompId,description: 'concept not found', active:false, found:false, disabled:true};
						}
					});	

					_this.set("importError",null);
					_this.model.setObjects(membersData2);
				}
				else
				{
					Ember.Logger.log(result.error);
					_this.set("importError",result.error);
				}

				_this.set("getConceptDataInProgress",false);
				return membersData2;
			});
			
			Ember.Logger.log("controllers.refsets.upload:actions:uploadMemberList (membersData)",membersData);			
		},

    }
});