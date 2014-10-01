import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

import MembersAdapter from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

import SnomedTypesAdapter from '../adapters/type-lookups';
var snomedTypesAdapter = SnomedTypesAdapter.create();

var numAutoServerRetries 		= 4;
var autoServerRetryInterval 	= 5; // Seconds
var autoServerRetryMultiplier 	= 1.5; // Amount to increase wait period before retrying again.

// Computed alias don't work in this controller - no container?


export default Ember.ObjectController.extend({
	
	needs 					: ["login"],
	
	refsets 				: [],
	unpublishedRefsets		: [],
	publishedRefsets		: [],
	refset 					: {},
	currentRefsetId			: null,
	showWaitCounter			: 0,
	hideWaitCounter			: 0,
	callsInProgressCounter	: 0,
	retryQueue				: [],
	moduleTypes				: {},
	refsetTypes				: {},
	componentTypes			: {},
	refsetTypesArray		: [],
	componentTypesArray		: [],
	moduleTypesArray		: [],

	init : function()
	{
		Ember.Logger.log("controllers.data:init");
		this.processRetryQueue();
	},

	initialiseAppData : function()
	{		
		Ember.Logger.log("controllers.data:initialiseAppData");

		var p1 = this.getSnomedRefsetTypes();
		var p2 = this.getSnomedModulesTypes();
		var p3 = this.getSnomedComponentTypes();
		
		return Ember.RSVP.all([p1,p2,p3]).then(function(){
			
			return true;
			
		});
	},
	
	processRetryQueue : function()
	{
		if (this.retryQueue.length)
		{
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

		this.set("showWaitCounter",this.callsInProgressCounter);
		this.set("hideWaitCounter",0);

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
	
	authenticationStatusChanged : function()
	{
		// Abandon any previous queued messages since we'll retry now
		this.applicationPathChanged();
		
		this.getAllRefsets();
		
		// If we are holding a refset then refresh it
		if (this.currentRefsetId !== null)
		{
			this.getRefset(this.currentRefsetId);
		}
	},
	
	showWaitAnim : function(fn)
	{
		this.set("showWaitCounter",this.showWaitCounter+1);
		
//		Ember.Logger.log("showWaitAnim (show,wait,calls,fn)",this.showWaitCounter,this.hideWaitCounter,this.callsInProgressCounter,fn);

		$('.waitAnim').show();
	},
	
	hideWaitAnim : function(fn)
	{
		this.set("hideWaitCounter",this.hideWaitCounter+1);
		
//		Ember.Logger.log("hideWaitAnim (show,wait,calls,fn)",this.showWaitCounter,this.hideWaitCounter,this.callsInProgressCounter,fn);

		if (this.showWaitCounter === this.hideWaitCounter)
		{
			$('.waitAnim').hide();
		}
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
				switch (resourceType)
				{
					case 'Refset':
					{
						this.set("refset",{error:1,unauthorised:1});
						break;
					}
				}
				
				// Question here is, has the user's token been updated?

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
				
				_this.hideWaitAnim(callbackFn);
				
				return;
			}

			case "404":
			{
				// Only going to work for refsets!!!!!!
				
				switch (resourceType)
				{
					case 'Refset':
					{
						this.set("refset",{error:1,notFound:1});
						break;
					}
				}

				// Not found
				Bootstrap.GNM.push('Not found','We cannot locate the ' + resourceType + ' you have requested.', 'warning');

				// Need to deal with this in the template as well...report to the user that what they want cannot be found.
				
				_this.hideWaitAnim(callbackFn);

				return;
			}
			
			default :
			{
				// Other error, worth retrying...
			
				if (retrying < numAutoServerRetries)
				{
					var waitPeriod = _this.getRetryWaitPeriod(retrying);
					
					Bootstrap.GNM.push('Communication Error','Error communicating with the server ' + (++retrying) + ' times. Will retry loading ' + resourceType + ' in ' + waitPeriod + ' seconds.', 'warning');
									
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
					if (!loginDialogOpen)
					{
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
				             			_this.send("abortDataRequest",resourceType);
				        				_this.hideWaitAnim(callbackFn);
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
					else
					{
						Bootstrap.GNM.push('Communication Failure','Error communicating with the server. ' + (numAutoServerRetries +1) + ' sucessive attempts to load ' + resourceType + ' have failed. Giving up.', 'danger');
             			_this.send("abortDataRequest",resourceType);
        				_this.hideWaitAnim(callbackFn);						
					}
					
				}
				
				return;
			}
		}
	},


	// -----------------------------------------------------------------------------------------------
	
	
	getAllRefsets : function(retry)
	{
		Ember.Logger.log("controllers.refsets:getAllRefSets (retrying)",retrying);

		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);
			
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retrying)
		{
			this.showWaitAnim('getAllRefSets');
		}
		
		refsetsAdapter.findAll(user).then(function(response)
		{	
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim('getAllRefsets');
				
				var publishedArray 		= [];
				var unpublishedArray 	= [];
				
				_this.refsets.setObjects(response);
				
				response.content.refsets.map(function(item)
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
			else
			{
				_this.handleRequestFailure(response,'List of Refsets','getAllRefsets',[],retrying);
			}
		});
	},
	
	getRefset : function(id,retry)
	{
		Ember.Logger.log("controllers.data:getRefset (id,retrying)",id,retrying);

		this.set("currentRefsetId",id);
		
		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retrying)
		{
			this.showWaitAnim('getRefset');
		}
		
		var refset = refsetsAdapter.find(user,id).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim('getRefset');

				// Successful response for our request
				Ember.Logger.log("Successful response for our request",response);
				
				response.content.refset.meta = {};
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
				
				_this.getMembers(idArray).then(function(conceptData)
				{
					var MemberData = _this.refset.members.map(function(member)
					{
						member.meta = {};

						if (typeof conceptData[member.referenceComponentId] !== "undefined" && conceptData[member.referenceComponentId] !== null)
						{
							member.meta.description 			= conceptData[member.referenceComponentId].label;
							member.meta.conceptActive 			= conceptData[member.referenceComponentId].active;
							member.meta.conceptEffectiveTime 	= conceptData[member.referenceComponentId].effectiveTime;
							member.meta.found 					= true;
							member.meta.deleteConcept			= false;
						}
						else
						{
							member.meta.description 			= 'Concept not found in Snomed CT database';
							member.meta.found 					= false;
							member.meta.deleteConcept			= false;
						}
						
						return member;
					});
					
					_this.refset.members.setObjects(MemberData);
				});

			}
			else
			{
				_this.handleRequestFailure(response,'Refset','getRefset',[id],retrying);
			}
		});
	},

	
	getMembers : function(members,retry)
	{
		Ember.Logger.log("controllers.refsets:getMembers (members,retry)",members,retry);

		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retrying)
		{
			this.showWaitAnim('getMembers');
		}
		
		var memberDetails = membersAdapter.findList(user,members).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			_this.hideWaitAnim('getMembers');

			if (typeof response.meta.errorInfo === 'undefined')
			{
				return response.content.concepts;
			}
			else
			{
				_this.handleRequestFailure(response,'Refset Types','getSnomedRefsetTypes',[],retrying);
				return {};
			}			
		});	
		
		return memberDetails;
	},
	
	getMember : function(id,retry)
	{
		Ember.Logger.log("controllers.refsets:getMember (id,retry)",id,retry);

		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;

		if (typeof this.concepts[id] !== "undefined")
		{
			return new Ember.RSVP.Promise(function(resolve){resolve(_this.concepts[id]);});
		}
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retrying)
		{
			this.showWaitAnim('getMember');
		}
		
		var memberDetails = membersAdapter.find(user,id).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			_this.hideWaitAnim('getMember');

			if (typeof response.meta.errorInfo === 'undefined')
			{
			//	_this.set("concepts[" + id + "]",response.content.concept); 
				return response.content.concept;
			}
			else
			{
				_this.handleRequestFailure(response,'Refset Types','getSnomedRefsetTypes',[],retrying);
				return {label:'not found'};
			}			
		});	
		
		return memberDetails;
	},
	
	getSnomedRefsetTypes : function(retry)
	{
		Ember.Logger.log("controllers.refsets:getSnomedRefsetTypes (retry)",retry);
		
		if (this.refsetTypes.length)
		{
			return;
		}
		
		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retrying)
		{
			this.showWaitAnim('getSnomedRefsetTypes');
		}
		
		var promise = snomedTypesAdapter.getRefsetTypes(user).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim('getSnomedRefsetTypes');
				_this.set("refsetTypes",response.content.refsetTypes);
				
				for (var x=0;x<RefsetENV.APP.supportedSnomedTypes.refsetTypes.length;x++)
				{
					var id = RefsetENV.APP.supportedSnomedTypes.refsetTypes[x];	
					_this.refsetTypesArray.pushObject({id:id,label:response.content.refsetTypes[id].replace(/ *\([^)]*\) */g, "")});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Refset Types','getSnomedRefsetTypes',[],retrying);
			}
			return response;
		});	
		
		return promise; 
	},

	getSnomedModulesTypes : function(retry)
	{
		Ember.Logger.log("controllers.refsets:getSnomedModulesTypes (retry)",retry);
		
		if (this.moduleTypes.length)
		{
			return;
		}

		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retrying)
		{
			this.showWaitAnim('getSnomedModulesTypes');
		}
		
		var promise = snomedTypesAdapter.getModules(user).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim('getSnomedModulesTypes');
				_this.set("moduleTypes",response.content.modules);	
				
				for (var id in response.content.modules)
				{
					_this.moduleTypesArray.pushObject({id:id,label:response.content.modules[id].replace(/ *\([^)]*\) */g, "")});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Module Types','getSnomedModulesTypes',[],retrying);
			}
			return response;
		});	
		
		return promise;
	},

	getSnomedComponentTypes : function(retry)
	{
		Ember.Logger.log("controllers.refsets:getSnomedComponentTypes (retry)",retry);
		
		if (this.componentTypes.length)
		{
			return;
		}

		var _this 		= this;
		var retrying 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retrying)
		{
			this.showWaitAnim('getSnomedComponentTypes');
		}
		
		var promise = snomedTypesAdapter.getComponentTypes(user).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim('getSnomedComponentTypes');
				_this.set("componentTypes",response.content.componentTypes);

				for (var x=0;x<RefsetENV.APP.supportedSnomedTypes.componentTypes.length;x++)
				{
					var id = RefsetENV.APP.supportedSnomedTypes.componentTypes[x];					
					_this.componentTypesArray.pushObject({id:id,label:response.content.componentTypes[id].replace(/ *\([^)]*\) */g, "")});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Component Types','getSnomedComponentTypes',[],retrying);
			}
			
			return response;
		});		
		
		return promise;
	},

});