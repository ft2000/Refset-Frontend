import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

import MembersAdapter from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

var numAutoServerRetries 		= 4;
var autoServerRetryInterval 	= 5; // Seconds
var autoServerRetryMultiplier 	= 1.5; // Amount to increase wait period before retrying again.

export default Ember.ObjectController.extend({
	
	needs 				: ["login","refsets"],
	
	refsets 			: [],
	unpublishedRefsets	: [],
	publishedRefsets	: [],
	refset 				: {},
	currentRefsetId		: null,
	concepts 			: {},
	dataLoadCountner	: 0,
	retryQueue			: [],
	
	init : function()
	{
		Ember.Logger.log("controllers.data:init");
		this.getAllRefsets();
		this.processRetryQueue();
	},

	processRetryQueue : function()
	{
		if (this.retryQueue.length)
		{
			Ember.Logger.log("controllers.data:processRetryQueue (retryQueue)",this.retryQueue);
		
			// Copy and empty the queue so we can work on a queue that does not change
			var queue = this.retryQueue;
			this.set("retryQueue",[]);
			
			for (var q=queue.length -1;q>=0;q--)
			{
				var queueItem 	= queue[q];
				var timeNow 	= new Date().getTime();
			
				if (queueItem.runTime <= timeNow)
				{
					queue.splice(q,1);
					this[queueItem.callbackFn].apply(this,queueItem.params);
					Bootstrap.GNM.push('Retrying communication','Retrying to request ' + queueItem.resourceType + ' from the server.', 'info');
				}
			}
			
			// Add anything left in our queue to the main one for future processing
			queue = queue.concat(this.retryQueue);
			this.set("retryQueue",queue);
		}	
		
		var _this = this;
		
		Ember.run.later(function(){_this.processRetryQueue();},250);
	},
	
	applicationPathChanged : function()
	{
		Ember.Logger.log("controllers.data:applicationPathChanged (retryQueue)",this.retryQueue);

		this.set("dataLoadCountner",0);

		var queue = this.retryQueue;
		
		for (var q=0;q<queue.length;q++)
		{
			var queueItem 	= queue[q];
			Bootstrap.GNM.push('Aborting communication','Aborting queued request for ' + queueItem.resourceType + ' from the server.', 'info');			
		}
		
		// Need to alert aborts before we do this...
		this.set("retryQueue",[]);
		
		$('.waitAnim').hide();
	},

	showWaitAnim : function()
	{
		this.set("dataLoadCountner",this.dataLoadCountner+1);
		
		Ember.Logger.log("showWaitAnim",this.dataLoadCountner,this.currentPath);

		$('.waitAnim').show();
	},
	
	hideWaitAnim : function()
	{
		this.set("dataLoadCountner",this.dataLoadCountner-1);
		
		Ember.Logger.log("hideWaitAnim",this.dataLoadCountner,this.currentPath);

		if (this.dataLoadCountner === 0)
		{
			$('.waitAnim').hide();
		}
	},

	
	getAllRefsets : function()
	{
		var _this = this;
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		Ember.Logger.log("controllers.refsets:getAllRefSets");
	
		this.showWaitAnim();
		
		refsetsAdapter.findAll(user).then(function(result)
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

			_this.hideWaitAnim();
			
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
		Ember.Logger.log("controllers.data:getRefset (id,retrying)",id,retrying);

		this.set("currentRefsetId",id);
		
		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;

		if (!retrying)
		{
			this.showWaitAnim();
		}
		
		var refset = refsetsAdapter.find(user,id).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				// Successful response for our request
				Ember.Logger.log("Successful response for our request",response);
				
				_this.set("refset",response.content.refset);
				
				// Now get member data...
				
				var idArray = _this.refset.members.map(function(member)
				{
					if (typeof member.referenceComponentId !== "undefined")
					{
						return member.referenceComponentId;						
					}
					else
					{
						return null;
					}
				});
				
				// Strip nulls
				idArray = $.grep(idArray,function(n){ return(n); });
				
				membersAdapter.findList(user,idArray).then(function(result)
				{
					if (result.status)
					{
						var conceptData = result.data;
																
						var tempMemberData = _this.refset.members.map(function(member)
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

						_this.refset.members.setObjects(tempMemberData);
					}
					else
					{
						Ember.Logger.log("result.error",result.error);
					}
					
					_this.hideWaitAnim();
				});	
			}
			else
			{
				var failureResponse = _this.handleRequestFailure(response,'Refset','getRefset',[id],retrying);
				// Do something with this?
			}

			return response;
		});
		
		this.set("refset",refset);
	},
	
	authenticationStatusChanged : function()
	{
		this.getAllRefsets();
		
		// If we are holding a refset then refresh it
		if (this.currentRefsetId !== null)
		{
			this.getRefset(this.currentRefsetId);
		}
	},
	
	handleRequestFailure : function(response,resourceType,callbackFn,callbackParams,retrying)
	{
		// Failed response... check errorInfo.code / message
		Ember.Logger.log("Failed response for our request (code,message)",response.meta.errorInfo.code,response.meta.errorInfo.message);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		var _this = this;
		
		switch(response.meta.errorInfo.code)
		{
			case "401":
			{
				this.set("refset",{error:1,unauthorised:1});

				if (user.token === null)
				{
					// User is not logged in, so prompt to login
					Bootstrap.GNM.push('Authentication Required','The ' + resourceType + ' you have requested is not publically available. You must log in to view it.', 'warning');
					loginController.showLoginForm();
				}
				else
				{
					// User is logged in, but it not permitted to access the requested resource
					Bootstrap.GNM.push('Not Authorised','You do not have permission to access the ' + resourceType + ' you have requested.', 'warning');
					
			        BootstrapDialog.show({
			            title: '<img src="assets/img/login.white.png"> Not Authorised',
			            closable: false,
			            message: 'You do not have permission to access the ' + resourceType + ' you have requested.',
			            buttons: [{
			                label: 'OK',
			                action: function(dialog) {
			                	// Go to parent route....
			                    dialog.close();
			                }
			            }]
			        });
				}
				
				_this.hideWaitAnim();
				
				return 401;
			}

			case "404":
			{
				this.set("refset",{error:1,notFound:1});

				// Not found
				Bootstrap.GNM.push('Not found','We cannot locate the ' + resourceType + ' you have requested.', 'warning');

				// Need to deal with this in the template as well...report to the user that what they want cannot be found.
				
				_this.hideWaitAnim();

				return 404;
			}
			
			default :
			{
				// Other error, worth retrying...
			
				if (retrying < numAutoServerRetries)
				{
					var waitPeriod = _this.getRetryWaitPeriod(retrying);
					
					Bootstrap.GNM.push('Communication Error','Error communicating with the server ' + (++retrying) + ' times. Will retry loading ' + resourceType + ' in ' + waitPeriod + ' seconds.', 'warning');
					
/*					
					setTimeout(function()
					{
						var params = callbackParams;
						params.push(retrying);
						return _this[callbackFn].apply(_this,params);							
						
					},waitPeriod * 1000);
*/					
					var params = callbackParams;
					params.push(retrying);

					var runTime = new Date().getTime() + (waitPeriod * 1000);
					
					var queue = _this.retryQueue;
					queue.push({resourceType:resourceType,callbackFn:callbackFn,params:params,runTime:runTime});
					
					_this.set("retryQueue",queue);

					return;
				}
				else
				{
					// Too many errors. Time to prompt the user
					Bootstrap.GNM.push('Communication Failure','Error communicating with the server. ' + (numAutoServerRetries +1) + ' sucessive attempts to load ' + resourceType + ' have failed.', 'danger');
					
			        BootstrapDialog.show({
			            title: '<img src="assets/img/login.white.png"> Communication Failure',
			            closable: false,
			            message: '<p>There has been a problem communicating with the server.</p><p>We have tried ' + (numAutoServerRetries +1) + ' times already.</p><p>Would you like to keep trying or give up?</p>',
			            buttons: 
			            [
			             	{
			             		label: 'Give up',
			             		action: function(dialog)
			             		{
			             			// Go to parent route.... location.href = ".." ?????
			             			_this.send("goBack");
			        				_this.hideWaitAnim();
			             			dialog.close();
			             		}
			             	},
			             	{
			             		label: 'Continue Trying',
			             		cssClass: 'btn-primary',
			             		action: function(dialog)
			             		{
			             			_this[callbackFn].apply(_this,callbackParams);
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
});