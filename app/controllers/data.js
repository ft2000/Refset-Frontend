import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

import MembersAdapter from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

import LoginAdapter	from '../adapters/login';
var loginAdapter = LoginAdapter.create();

var numAutoServerRetries 		= 4;
var autoServerRetryInterval 	= 5; // Seconds
var autoServerRetryMultiplier 	= 1.5; // Amount to increase wait period before retrying again.

export default Ember.ObjectController.extend({
	
	needs 				: ["login","refsets","news"],
	
	refsets 			: [],
	unpublishedRefsets	: [],
	publishedRefsets	: [],
	refset 				: {},
	concepts 			: {},
	latestNews 			: Ember.computed.alias("controllers.news.latestNews"),
	allNews 			: Ember.computed.alias("controllers.news.model"),
	
	user				: Ember.computed.alias("controllers.login.user"),
	
	init : function()
	{
		Ember.Logger.log("controllers.data:init");
		this.getAllRefsets(1);
	},
	
	getAllRefsets : function(reinit)
	{
		var _this = this;
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		Ember.Logger.log("controllers.refsets:getAllRefSets");
	
		refsetsAdapter.findAll(user,reinit).then(function(result)
		{	
			if (!result.dataError)
			{
				var publishedArray 		= [];
				var unpublishedArray 	= [];
				
				_this.refsets.setObjects(result);
				
				result.map(function(item)
				{
					if (item.published)
					{
						publishedArray.push(item);
					}
					else
					{
						unpublishedArray.push(item);					
					}
				});
								
				var sortedPublishedArray = publishedArray.sort(function(a,b)
				{
				    return new Date(b.publishedDate) - new Date (a.publishedDate);
				});			

				_this.publishedRefsets.setObjects(sortedPublishedArray);
			
				var sortedUnpublishedArray = unpublishedArray.sort(function(a,b)
				{
				    return new Date(b.publishedDate) - new Date (a.publishedDate);
				});			

				_this.unpublishedRefsets.setObjects(sortedUnpublishedArray);
			}

		});
	},

	

	getRetryWaitPeriod : function(counter)
	{
		var multiplier = 1;
		
		for (var c=0;c<counter;c++)
		{
			multiplier = multiplier * autoServerRetryMultiplier;
		}
		
		return Math.ceil(autoServerRetryInterval * multiplier);
	},
	
	getRefset : function(id,retry)
	{
		var _this = this;
		var retrying = (typeof retry === "undefined" ? 0 : retry);

		Ember.Logger.log("controllers.data:getRefset (id,retrying)",id,retrying);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		var refset = refsetsAdapter.find(user,id).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				// Successful response for our request
				Ember.Logger.log("Successful response for our request",response);
				
				_this.set("refset",response.content.refset);
			}
			else
			{
				// Failed response... check errorInfo.code / message
				Ember.Logger.log("Failed response for our request (code,message)",response.meta.errorInfo.code,response.meta.errorInfo.message);
				
				switch(response.meta.errorInfo.code)
				{
					case 401:
					{
						if (user.token === null)
						{
							// User is not logged in, so prompt to login
							Bootstrap.GNM.push('Authentication Required','The resource you have requested requires you to login.', 'warning');
					
					        BootstrapDialog.show({
					            title: '<img src="assets/img/login.white.png"> Authentication Required',
					            closable: false,
					            message: 'The resource you have requested requires you to login.',
					            buttons: 
					            [
					             	{
					             		label		: 'Register',
					             		cssClass	: 'btn-default left',
					             		action		: function(dialog)
					             		{
					             			history.go(-1);
					             			dialog.close();
					             		}
					             	},
					             	{
					             		label	: 'Continue as a guest',
					             		action	: function(dialog)
					             		{
					             			history.go(-1);
					             			dialog.close();
					             		}
					             	},
					             	{
					             		label		: 'Login',
					             		cssClass	: 'btn-primary',
					             		icon		: 'glyphicon glyphicon-user',
					             		id 			: 'submit-btn',
					             		hotkey		: 13, // Enter key
					             		action 		: function(dialog)
					             		{
					             			var btn = this;
					             			btn.spin();

					             			_this.login('ianbale','Lotusm250').then(function(loginResult)
					             			{
						             			if (loginResult)
						             			{
						             				Ember.run.next(function(){_this.getRefset(id);});
						             				dialog.close();
						             			}
						             			else
						             			{
							             			btn.stopSpin();		             									             				
						             			}
					             			});
					             		}
					             	}
					             ]
					        });						
						}
						else
						{
							// User is logged in, but it not permitted to access the requested resource
							Bootstrap.GNM.push('Not Authorised','You do not have permission to access the resource you have requested.', 'warning');
							
					        BootstrapDialog.show({
					            title: 'Not Authorised',
					            closable: false,
					            message: 'You do not have permission to access the resource you have requested.',
					            buttons: [{
					                label: 'OK',
					                action: function(dialog) {
					                	history.go(-1);
					                    dialog.close();
					                }
					            }]
					        });
						}
						
						break;
					}

					case 404:
					{
						// Not found
						Bootstrap.GNM.push('Not found','We cannot locate the resource you have requested.', 'warning');

						break;
					}
					
					default :
					{
						// Other error, worth retrying...
					
						if (retrying < numAutoServerRetries)
						{
							var waitPeriod = _this.getRetryWaitPeriod(retrying);
							
							Bootstrap.GNM.push('Communication Error','Error communicating with the server ' + (++retrying) + ' times. Will retry in ' + waitPeriod + ' seconds.', 'warning');
							
							var retry = Ember.run.later(function()
							{
								return _this.getRefset(id,retrying);
							},waitPeriod * 1000);
							
							return retry;
						}
						else
						{
							// Too many errors. Time to prompt the user
							Bootstrap.GNM.push('Communication Failure','Error communicating with the server. ' + numAutoServerRetries + ' sucessive attempts have failed.', 'danger');
							
					        BootstrapDialog.show({
					            title: 'Communication Failure',
					            closable: false,
					            message: '<p>There has been a problem communicating with the server.</p><p>We have tried several times already.</p><p>Would you like to keep trying or give up?</p>',
					            buttons: 
					            [
					             	{
					             		label: 'Give up',
					             		action: function(dialog)
					             		{
					             			dialog.close();
					             		}
					             	},
					             	{
					             		label: 'Continue Trying',
					             		cssClass: 'btn-primary',
					             		action: function(dialog)
					             		{
					             			_this.getRefset(id);
					             			dialog.close();
					             		}
					             	}
					             ]
					        });
						}
						
						break;
					}
				}
			}
/*			
			if (!refsetData.authError)
			{
				var idArray = refsetData.members.map(function(member)
				{
					return member.referenceComponentId;
				});
									
				membersAdapter.findList(user,idArray).then(function(result)
				{
					if (result.status)
					{
						var conceptData = result.data;
																
						var tempMemberData = refsetData.members.map(function(member)
						{
							if (conceptData[member.referenceComponentId] !== null)
							{
								member.description 		= conceptData[member.referenceComponentId].label;
								member.conceptactive 	= conceptData[member.referenceComponentId].active;
								member.found 			= true;
							}
							else
							{
								member.description 		= 'concept not found';
								member.found 			= false;
							}
							
							return member;
						});	

						refsetData.members.setObjects(tempMemberData);
					}
					else
					{
						Ember.Logger.log("result.error",result.error);
					}
				});
			}
			else
			{
				Ember.Logger.log("get refset failed...",refsetData);
			}
*/
			return response;
		});
		
		this.set("refset",refset);
	},

	login : function(username,password)
	{
		var _this = this;
		
		return loginAdapter.authenticate(username,password).then(function(authResult)
		{
			Ember.Logger.log("login",authResult);
			
			var user = authResult.user;
			
			if (authResult.authenticated)
			{
				return loginAdapter.isPermittedToUseRefset(user.name).then(function(permissionResult)
				{
					if (permissionResult)
					{
						var loginController = _this.get('controllers.login');
						loginController.set("user",user);
					}
					
					return permissionResult;
				});			
			}
			else
			{
				return false;
			}
			
		});
	},
	
	actions :
	{

		
	}
});