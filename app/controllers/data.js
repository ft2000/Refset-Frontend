import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

import MembersAdapter from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

import SnomedTypesAdapter from '../adapters/type-lookups';
var snomedTypesAdapter = SnomedTypesAdapter.create();

// Computed alias don't work in this controller - no container?

var autoServerRetryInterval		= 5;	// Seconds before retrying
var autoServerRetryMultiplier 	= 1.5; 	// Multiply autoServerRetryInterval by this between each retry (so wait period gets longer)
var numAutoServerRetries		= 5; 	// Number of times to auto-retry before prompting user

export default Ember.ObjectController.extend({
	
	needs 					: ["login"],
	
	refsets 				: [],
	unpublishedRefsets		: [],
	publishedRefsets		: [],
	refset 					: {},
	currentRefset			: null,
	currentAllRefsets		: null,
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
	initialised				: false,

	init : function()
	{
		Ember.Logger.log("controllers.data:init");
		this.processRetryQueue();
	},

	initialiseAppData : function()
	{		
		Ember.Logger.log("controllers.data:initialiseAppData");

		var p1 = this.getSnomedRefsetTypes().then(function(p){return typeof p.meta.errorInfo === "undefined";});
		var p2 = this.getSnomedModulesTypes().then(function(p){return typeof p.meta.errorInfo === "undefined";});
		var p3 = this.getSnomedComponentTypes().then(function(p){return typeof p.meta.errorInfo === "undefined";});
		
		return Ember.RSVP.all([p1,p2,p3]).then(function(){
			return {refsets:p1._result,modules:p2._result,components:p3._result};
		}).then(function(init)
		{
			if (!init.refsets)
			{
				Bootstrap.GNM.push('Communication Error','API not responding. Application Failed to initialize Refset Types. retryCounter.', 'warning');	
			}

			if (!init.modules)
			{
				Bootstrap.GNM.push('Communication Error','API not responding. Application Failed to initialize Modules Types. retryCounter.', 'warning');	
			}

			if (!init.components)
			{
				Bootstrap.GNM.push('Communication Error','API not responding. Application Failed to initialize Refset Component Types. retryCounter.', 'warning');	
			}
			
			return (init.refsets && init.refsets && init.refsets);
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
					Bootstrap.GNM.push('retryCounter communication','retryCounter to request ' + queueItem.resourceType + ' from the server.', 'info');
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
		Ember.Logger.log("controllers.data:applicationPathChanged (retryQueue,initialised)",this.retryQueue,this.initialised);

		if (!this.initalised)
		{
			if (this.refsetTypesArray.length && this.componentTypesArray.length && this.moduleTypesArray.length)
			{
				this.set("initialised",true);
			}
		}
		
		if (this.initialised)
		{
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
		}
	},
	
	authenticationStatusChanged : function()
	{
		// Abandon any previous queued messages since we'll retry now
		this.applicationPathChanged();
		
		if (this.currentAllRefsets !== null)
		{
			this.getAllRefsets(this.currentAllRefsets.callingController,this.currentAllRefsets.completeAction);
		}
		
		// If we are holding a refset then refresh it
		if (this.currentRefset !== null)
		{
			this.getRefset(this.currentRefset.id,this.currentRefset.callingController,this.currentRefset.completeAction);
		}
	},
	
	showWaitAnim : function()
	{
		this.set("showWaitCounter",this.showWaitCounter+1);
		
		$('.waitAnim').show();
	},
	
	hideWaitAnim : function()
	{
		this.set("hideWaitCounter",this.hideWaitCounter+1);
		
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
	
	handleRequestFailure : function(response,resourceType,callbackFn,callbackParams,callingController,completeAction,retryCounter)
	{
		var _this = this;
		
		switch(response.meta.errorInfo.code)
		{
			case "401":
			{
				var loginController = this.get('controllers.login');
				var user = loginController.user;
								
				// Question here is, has the user's token been updated?

				if (user.token === null)
				{
					// User is not logged in, so prompt to login
					Bootstrap.GNM.push('Authentication Required','The ' + resourceType + ' you have requested is not publically available. You must log in to view it.', 'warning');
					loginController.showLoginForm();

    				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
    				{
        				callingController.send(completeAction,response);
    				}				
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
				
				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				{
    				callingController.send(completeAction,{error:1,unauthorised:1});
				}
				
				return;
			}

			case "404":
			{
				// Only going to work for refsets!!!!!!
				
				// Not found
				Bootstrap.GNM.push('Not found','We cannot locate the ' + resourceType + ' you have requested.', 'warning');

				_this.hideWaitAnim();
				
				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				{
    				callingController.send(completeAction,{error:1,notFound:1});
				}

				return;
			}
			
			default :
			{
				// Other error, worth retryCounter...
			
				if (retryCounter < numAutoServerRetries)
				{
					var waitPeriod = _this.getRetryWaitPeriod(retryCounter);
					
					Bootstrap.GNM.push('Communication Error','Error communicating with the server ' + (++retryCounter) + ' times. Will retry ' + resourceType + ' in ' + waitPeriod + ' seconds.', 'warning');
									

					var params = callbackParams;
					if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
					{
						params.push(callingController);
						params.push(completeAction);
					}
					params.push(retryCounter);

					var runTime = new Date().getTime() + (waitPeriod * 1000);
					
					var queue = _this.retryQueue;
					queue.push({resourceType:resourceType,callbackFn:callbackFn,params:params,runTime:runTime});
					
					_this.set("retryQueue",queue);
					
					return;
				}
				else
				{
					// Too many errors. Time to prompt the user
					if (!this.loginDialogOpen || !this.initialised)
					{
						Bootstrap.GNM.push('Communication Failure','Error communicating with the server. ' + (numAutoServerRetries +1) + ' sucessive attempts to ' + resourceType + ' have failed.', 'danger');

						BootstrapDialog.show({
				            title: '<img src="assets/img/login.white.png"> Communication Failure : ' + resourceType,
				            closable: false,
				            message: '<p>There has been a problem communicating with the server.</p><p>We have tried ' + (numAutoServerRetries +1) + ' times already to ' + resourceType + '.</p><p>Would you like to keep trying or give up?</p>',
				            buttons: 
				            [
				             	{
				             		label: 'Give up',
				             		action: function(dialog)
				             		{
				             			_this.hideWaitAnim();
				        				
				        				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				        				{
				            				callingController.send(completeAction,{error:1,commsError:1});
				        				}
				        				
				             			dialog.close();
				             		}
				             	},
				             	{
				             		label: 'Continue Trying',
				             		cssClass: 'btn-primary',
				             		action: function(dialog)
				             		{
				    					var params = callbackParams;
				    					if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				    					{
				    						params.push(callingController);
				    						params.push(completeAction);
				    					}
				    					params.push(retryCounter);
				    					
				    					_this[callbackFn].apply(_this,params);
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
        				_this.hideWaitAnim();
        				
        				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
        				{
            				callingController.send(completeAction,{error:1,commsError:1});
        				}

        				return;
					}
					
				}
			}
		}
	},


	// -----------------------------------------------------------------------------------------------
	
	
	getAllRefsets : function(callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.refsets:getAllRefSets (retry)",retry);
		
		var _this 		= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
	
		this.set("currentAllRefsets",{callingController:callingController,completeAction:completeAction});	
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		refsetsAdapter.findAll(user).then(function(response)
		{	
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim();
				
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
				callingController.send(completeAction,{error:0});
			}
			else
			{
				_this.handleRequestFailure(response,'Get list of refsets','getAllRefsets',[],callingController,completeAction,retryCounter);
			}
		});
	},
	
	getRefset : function(id,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:getRefset (id,callingController,completeAction,retry)",id,callingController,completeAction,retry);

		this.set("currentRefset",{id:id,callingController:callingController,completeAction:completeAction});
		
		var _this 		= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		refsetsAdapter.find(user,id).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim();

				response.content.refset.meta = {};
				_this.set("refset",response.content.refset);
				
				// Now get member data...
				
				if (typeof _this.refset.members === "undefined")
				{
					_this.set("refset.members",[]);
				}
				
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
				
				if (idArray.length)
				{
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
						callingController.send(completeAction,{error:0});
					});
				}
				else
				{
					callingController.send(completeAction,{error:0});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Refset','getRefset',[id],callingController,completeAction,retryCounter);
			}
		});
	},
	
	createRefset : function(refset,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:createRefset (retry,callingController,completeAction,retry)",retry,callingController,completeAction,refset);

		var _this 		= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		refsetsAdapter.create(user,refset).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				Ember.Logger.log("Refset created:",response.content.id);
				
				refset.id = response.content.id;		
		
				_this.set("model",refset);
				
				callingController.send(completeAction,{error:0,id:refset.id});				
			}	
			else
			{
				_this.handleRequestFailure(response,'Create refset','createRefset',[refset],callingController,completeAction,retryCounter);
			}
		});
	},

	deleteRefset : function(refsetId,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:deleteRefset (refsetId,callingController,completeAction,refset,retry)",refsetId,callingController,completeAction,retry);

		var _this 		= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		refsetsAdapter.deleteRefset(user,refsetId).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				callingController.send(completeAction,{error:0});				
			}	
			else
			{
				_this.handleRequestFailure(response,'Delete refset','deleteRefset',[refsetId],callingController,completeAction,retryCounter);
			}
		});
	},
	
	addMembers : function(refsetId,members,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.refsets:addMembers (members,retry)",members,retry);

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user 			= loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		var result = refsetsAdapter.addMembers(user,refsetId,members).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			_this.hideWaitAnim();

			callingController.send(completeAction,{error:0,refsetId:refsetId,members:response.content.outcome});	

			// response needs to be changed since it contains no meta info
			// for now I'll ignore it...
			/*
			if (typeof response.meta.errorInfo === 'undefined')
			{
				return response.content.outcome;
			}
			else
			{
				_this.handleRequestFailure(response,'Add members to refset','addMembers',[refsetId,members],retryCounter);
				return {};
			}
			*/
		});
	},
	
	
	getMembers : function(members,retry)
	{
		Ember.Logger.log("controllers.refsets:getMembers (members,retry)",members,retry);

		var _this 		= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		var memberDetails = membersAdapter.findList(user,members).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			_this.hideWaitAnim();

			if (typeof response.meta.errorInfo === 'undefined')
			{
				return response.content.concepts;
			}
			else
			{
				_this.handleRequestFailure(response,'Get refset member details','getMembers',[members],retryCounter);
				return {};
			}			
		});	
		
		return memberDetails;
	},
	
	getMember : function(id,retry)
	{
		Ember.Logger.log("controllers.refsets:getMember (id,retry)",id,retry);

		var _this 		= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;

		if (typeof this.concepts[id] !== "undefined")
		{
			return new Ember.RSVP.Promise(function(resolve){resolve(_this.concepts[id]);});
		}
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		var memberDetails = membersAdapter.find(user,id).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			_this.hideWaitAnim();

			if (typeof response.meta.errorInfo === 'undefined')
			{
			//	_this.set("concepts[" + id + "]",response.content.concept); 
				return response.content.concept;
			}
			else
			{
				_this.handleRequestFailure(response,'Get refset memebr details','getMember',[id],retryCounter);
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
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		var promise = snomedTypesAdapter.getRefsetTypes(user).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim();
				_this.set("refsetTypes",response.content.refsetTypes);
				
				for (var x=0;x<RefsetENV.APP.supportedSnomedTypes.refsetTypes.length;x++)
				{
					var id = RefsetENV.APP.supportedSnomedTypes.refsetTypes[x];	
					_this.refsetTypesArray.pushObject({id:id,label:response.content.refsetTypes[id].replace(/ *\([^)]*\) */g, "")});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Get refset types','getSnomedRefsetTypes',[],retryCounter);
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
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		var promise = snomedTypesAdapter.getModules(user).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim();
				_this.set("moduleTypes",response.content.modules);	
				
				for (var id in response.content.modules)
				{
					_this.moduleTypesArray.pushObject({id:id,label:response.content.modules[id].replace(/ *\([^)]*\) */g, "")});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Get module types','getSnomedModulesTypes',[],retryCounter);
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

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		var promise = snomedTypesAdapter.getComponentTypes(user).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
			{
				_this.hideWaitAnim();
				_this.set("componentTypes",response.content.componentTypes);

				for (var x=0;x<RefsetENV.APP.supportedSnomedTypes.componentTypes.length;x++)
				{
					var id = RefsetENV.APP.supportedSnomedTypes.componentTypes[x];					
					_this.componentTypesArray.pushObject({id:id,label:response.content.componentTypes[id].replace(/ *\([^)]*\) */g, "")});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Get refset component types','getSnomedComponentTypes',[],retryCounter);
			}
			
			return response;
		});		
		
		return promise;
	},

});