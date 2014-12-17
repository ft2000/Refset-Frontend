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
	inactiveRefsets			: [],
	refset 					: {},
	refsetHistory 			: {},
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
	languagesArray			: [{id:'en_US',label:'US English'}],
	languageTypes			: {'en_US' : 'US English'},
	initialised				: false,
	refsetMemberRequestQueue : [],
	refsetsRequestQueue : [],
	
	moduleUpdatersArray			: function()
	{
		var users = [];
		
		var members = this.get("refset.members");
		
		for (var m=0;m<members.length;m++)
		{
			var updater = members[m].modifiedBy;
					
			if ($.inArray(updater,users) === -1)
			{
				users.push(updater);
			}
		}
		
		for (m=0;m<users.length;m++)
		{
			var userObj = {id:users[m],label:users[m]};
			users[m] = userObj;
		}
		
		return users;
	}.property('refset.members.@each'),

	refsetUpdatersArray			: function()
	{
		var users = [];
		
		var refsets = this.get("refsets");
			
		for (var m=0;m<refsets.length;m++)
		{
			var updater = refsets[m].modifiedBy;
					
			if ($.inArray(updater,users) === -1)
			{
				users.push(updater);
			}
		}
		
		for (m=0;m<users.length;m++)
		{
			var userObj = {id:users[m],label:users[m]};
			users[m] = userObj;
		}
		
		return users;
	}.property('refsets.@each'),
	
	refsetEffectiveTimesArray			: function()
	{
		var times = [];
		
		var refsets = this.get("refsets");
		
		for (var m=0;m<refsets.length;m++)
		{
			if (typeof refsets[m].latestEffectiveTime !== "undefined")
			{
				var effTime = refsets[m].latestEffectiveTime;

				if ($.inArray(effTime,times) === -1)
				{
					times.push(effTime);
				}
			}
		}
		
		for (m=0;m<times.length;m++)
		{
			var timeString = moment(times[m]).format("YYYYMMDD");
			var timeObj = {id:times[m],label:timeString};
			times[m] = timeObj;
		}
		
		return times;
	}.property('refsets.@each'),
	
	
	effectiveTimeArray			: function()
	{
		var times = [];
		
		var members = this.get("refset.members");
		
		for (var m=0;m<members.length;m++)
		{
			var effTime = members[m].latestEffectiveTime;
					
			if ($.inArray(effTime,times) === -1)
			{
				times.push(effTime);
			}
		}
		
		for (m=0;m<times.length;m++)
		{
			var timeString = moment(times[m]).format("YYYYMMDD");
			var timeObj = {id:times[m],label:timeString};
			times[m] = timeObj;
		}
		
		return times;
	}.property('refset.members.@each'),

	
	init : function()
	{
		Ember.Logger.log("controllers.data:init");
		this.processRetryQueue();
	},

	clearRefset : function()
	{
		this.set("refset",{});
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
				Bootstrap.NM.push('Communication Error : API not responding. Application Failed to initialize Refset Types. retryCounter.', 'warning');	
			}

			if (!init.modules)
			{
				Bootstrap.NM.push('Communication Error : API not responding. Application Failed to initialize Modules Types. retryCounter.', 'warning');	
			}

			if (!init.components)
			{
				Bootstrap.NM.push('Communication Error : API not responding. Application Failed to initialize Refset Component Types. retryCounter.', 'warning');	
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

			// Need to alert aborts before we do this...
			this.set("retryQueue",[]);
			this.set("refsetMemberRequestQueue",[]);		
			
			$('.waitAnim').hide();
		}
	},
	
	authenticationStatusChanged : function()
	{
		Ember.Logger.log("controllers.data:authenticationStatusChanged");
		
		// Abandon any previous queued messages since we'll retry now
		this.applicationPathChanged();
		
		if (this.currentAllRefsets !== null)
		{
			this.getAllRefsets(this.currentAllRefsets.callingController,this.currentAllRefsets.completeAction);
		}
		
		// If we are holding a refset then refresh it
		if (this.currentRefset !== null)
		{
			this.getRefset(this.currentRefset.uuid,this.currentRefset.callingController,this.currentRefset.completeAction);
		}
	},
	
	showWaitAnim : function()
	{
//		this.set("showWaitCounter",this.showWaitCounter+1);
		
//		$('.waitAnim').show();
	},
	
	hideWaitAnim : function()
	{
//		this.set("hideWaitCounter",this.hideWaitCounter+1);
		
//		if (this.showWaitCounter === this.hideWaitCounter)
//		{
//			$('.waitAnim').hide();
//		}
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
			case "302":
			{
				// User is logged in, but it not permitted to access the requested resource
				Bootstrap.NM.push('Resource already exists : ' + resourceType, 'warning');

				_this.hideWaitAnim();
				
				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				{
					callingController.send(completeAction,{error:1,message:response.meta.errorInfo.message});
				}
				
				return;
			}
		
			case "401":
			{
				var loginController = this.get('controllers.login');
				var user = loginController.user;
								
				// Question here is, has the user's token been updated?

				if (user.token === null)
				{
					// User is not logged in, so prompt to login
					Bootstrap.NM.push('Authentication Required : The ' + resourceType + ' you have requested is not publically available. You must log in to view it.', 'warning');
					loginController.showLoginForm();
				}
				else
				{
					// User is logged in, but it not permitted to access the requested resource
					Bootstrap.NM.push('Not Authorised : You do not have permission to access the ' + resourceType + ' you have requested.', 'warning');
					
			        BootstrapDialog.show({
			            title: 'Not Authorised',
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
    				callingController.send(completeAction,{error:1,unauthorised:1,message:response.meta.errorInfo.message});
				}
				
				return;
			}

			case "404":
			{
				// Not found
				Bootstrap.NM.push('Not found : We cannot locate the ' + resourceType + ' you have requested.', 'warning');

				_this.hideWaitAnim();
				
				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				{
    				callingController.send(completeAction,{error:1,notFound:1,message:response.meta.errorInfo.message});
				}

				return;
			}
			
			case "400":
			{
				// Bad Request
				Bootstrap.NM.push('Bad Request : Server rejected our request', 'warning');

				_this.hideWaitAnim();
				
				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				{
    				callingController.send(completeAction,{error:1,requestError:1,message:response.meta.errorInfo.message});
				}

				return;
			}
			
			default :
			{
				// Other error, worth retryCounter...
			
				if (retryCounter < numAutoServerRetries)
				{
					var waitPeriod = _this.getRetryWaitPeriod(retryCounter);
					
					Bootstrap.NM.push('Communication Error : Error communicating with the server ' + (++retryCounter) + ' times. Will retry ' + resourceType + ' in ' + waitPeriod + ' seconds.', 'warning');
									

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
						Bootstrap.NM.push('Communication Failure : Error communicating with the server. ' + (numAutoServerRetries +1) + ' sucessive attempts to ' + resourceType + ' have failed.', 'danger');

						BootstrapDialog.show({
				            title: 'Communication Failure : ' + resourceType,
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
				            				callingController.send(completeAction,{error:1,commsError:1,message:"cannot connect to server"});
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
						Bootstrap.NM.push('Communication Failure : Error communicating with the server. ' + (numAutoServerRetries +1) + ' sucessive attempts to load ' + resourceType + ' have failed. Giving up.', 'danger');
             			_this.send("abortDataRequest",resourceType);
        				_this.hideWaitAnim();
        				
        				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
        				{
            				callingController.send(completeAction,{error:1,commsError:1,message:"cannot connect to server"});
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
		
		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
	
		this.set("currentAllRefsets",{callingController:callingController,completeAction:completeAction});	
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		this.set("refsets",[]);
		
		return refsetsAdapter.findAll(user,0,1).then(function(response) // Get count of how many refsets (not implemented in back end yet...)
		{
			// Need to pick up total number of refsets from the response here...
			
			var start = 0, end = 0;
			var idArraySlices = [];
			
			var totalNumRefsets = 100;
			
			while (start < totalNumRefsets)
			{
				end = Math.min(start + 99,totalNumRefsets);
				
				if (start === 0) {end = 10;}
				
				idArraySlices.push({user:user,from:start,to:end});
				
				start = end + 1;
			}
			
			_this.refsetsRequestQueue.setObjects(idArraySlices);
			
			_this.processRefsetsRequestQueue(callingController,completeAction,retryCounter);
							
//			if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
//			{
//				callingController.send(completeAction,{error:0});
//			}
		});
	},
	
	processRefsetsRequestQueue : function(callingController,completeAction,retryCounter)
	{
		var _this = this;
		var promise;
		
		if (this.refsetsRequestQueue.length)
		{
			var refsetsToProcess = this.refsetsRequestQueue.shift();

			promise = this.getRefsetChunks(callingController,completeAction,retryCounter,refsetsToProcess.user,refsetsToProcess.from,refsetsToProcess.to).then(function(response)
			{
				if (typeof response === "undefined" || response.error)
				{
					Ember.Logger.log("processRefsetsRequestQueue error",response);
				}
			});
		}
		
		Ember.RSVP.all([promise]).then(function()
		{
			if (_this.refsetsRequestQueue.length)
			{
				_this.processRefsetsRequestQueue(callingController,completeAction,retryCounter);
			}
		});
	},

	getRefsetChunks : function(callingController,completeAction,retryCounter,user,from,to)
	{	
		var _this = this;
		
		return refsetsAdapter.findAll(user,from,to).then(function(response)
		{	
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);
			
			if (typeof response.meta.errorInfo === 'undefined')
			{
				var refsetsArray 		= [];			

				response.content.refsets.map(function(item)
				{
					var moduleType 		= _this.moduleTypes[item.moduleId];
					var componentType 	= _this.componentTypes[item.componentTypeId];
					var language 		= _this.languageTypes[item.languageCode];
					var typeId 			= _this.refsetTypes[item.typeId];

					item.meta = {type:typeId,moduleType:moduleType,componentType:componentType,language:language,disabled:false};

					if (item.active)
					{
						if (item.published)
						{
							item.meta.status = 'published';
						}
						else
						{
							item.meta.status = 'unpublished';
						}
					}
					else
					{
						item.meta.status = 'inactive';
						item.meta.disabled = true;
					}

					refsetsArray.push(item);

				});
				
				_this.refsets.setObjects(_this.get("refsets").concat(refsetsArray));

				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					_this.hideWaitAnim();
					callingController.send(completeAction,{error:0});
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Get list of refsets','getAllRefsets',[],callingController,completeAction,retryCounter);
			}
		});
	},
	
	getRefsetHistory : function(id,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:getRefsetHistory (id,callingController,completeAction,retry)",id,callingController,completeAction,retry);
		
		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		refsetsAdapter.getRefsetHistoryHeader(user,id).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);
			Ember.Logger.log("refsetsAdapter.getRefsetHistoryHeader",response);
		});
	},
	
	getRefset : function(id,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:getRefset (id,callingController,completeAction,retry)",id,callingController,completeAction,retry);

		this.set("currentRefset",{id:id,callingController:callingController,completeAction:completeAction});
		
		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		refsetsAdapter.findHeader(user,id).then(function(response)
		{
			if (response.meta.status === 'OK')
			{
				_this.hideWaitAnim();

				response.content.refset.meta 	= {};
				response.content.refset.members	= [];
				
				response.content.refset.meta.allMembersLoaded = false;
				
				_this.set("refset",response.content.refset);
				
				// Now get member data...
				
				var start = 0, end = 0;
				var idArraySlices = [];
				
				while (start < response.content.refset.totalNoOfMembers)
				{
					end = Math.min(start + 199,response.content.refset.totalNoOfMembers);
					
					if (start === 0) {end = 10;}
					
					idArraySlices.push({from:start,to:end});
					
					_this.set("callsInProgressCounter",_this.callsInProgressCounter+1);
					
					start = end + 1;
				}
								
				_this.refsetMemberRequestQueue.setObjects(idArraySlices);
				_this.processRefsetMemberRequestQueue(user,id);
								
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0});
				}

				_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);
			}
			else
			{
				_this.handleRequestFailure(response,'Refset','getRefset',[id],callingController,completeAction,retryCounter);
			}
		});
	},
	
	processRefsetMemberRequestQueue : function(user,id)
	{
		var _this = this;
		var promise;
		
		if (this.refsetMemberRequestQueue.length)
		{
			var membersToProcess = this.refsetMemberRequestQueue.shift();
	
			promise = this.getRefsetMembers(user,id,membersToProcess.from,membersToProcess.to).then(function(response)
			{
				if (typeof response === "undefined" || response.error)
				{
					Ember.Logger.log("processRefsetMemberRequestQueue error",response);
				}
			});
		}
		
		Ember.RSVP.all([promise]).then(function()
		{
			if (_this.refsetMemberRequestQueue.length)
			{
				_this.processRefsetMemberRequestQueue(user,id);
			}
		});
	},
	
	getRefsetMembers : function(user,id,from,to)
	{	
		var _this = this;
		
		return refsetsAdapter.findMembers(user,id,from,to).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);
			
			if (typeof _this.refset.members !== "undefined")
			{
				var members = _this.refset.members.concat(response.content.members);
				
				var MemberData = members.map(function(member)
				{
					member.meta = {};
	
					member.meta.conceptActive 			= true;
					member.meta.found 					= true;
					member.meta.deleteConcept			= false;
					
					member.meta.originalActive			= member.active;
					member.meta.originalModuleId		= member.moduleId;
					
					return member;
				});
				
				_this.refset.members.setObjects(MemberData);
				
				if (_this.refset.members.length === _this.refset.totalNoOfMembers)
				{
					_this.set("refset.meta.allMembersLoaded",true);
				}
// IAN				
				return {error:0};
			}
			else
			{
				return {error:1,message:repsonse.meta.errorInfo.message};
			}
		});
	
	},
	
	createRefset : function(refset,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:createRefset (retry,callingController,completeAction,retry)",retry,callingController,completeAction,refset);

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		refsetsAdapter.create(user,refset).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				refset.uuid = response.content.uuid;		
		
				_this.set("model",refset);
				
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0,uuid:refset.uuid});				
				}
			}
			else
			{
				_this.handleRequestFailure(response,'Create refset','createRefset',[refset],callingController,completeAction,retryCounter);
			}
		});
	},

	deleteRefset : function(refsetId,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:deleteRefset (refsetId,callingController,completeAction,retry)",refsetId,callingController,completeAction,retry);

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		refsetsAdapter.deleteRefset(user,refsetId).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				Bootstrap.NM.push('Refset Service : Refset deleted', 'info');

				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0});				
				}
			}	
			else
			{
				_this.handleRequestFailure(response,'Delete refset','deleteRefset',[refsetId],callingController,completeAction,retryCounter);
			}
		});
	},
	
	updateRefset : function(refset,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:updateRefset (refset,callingController,completeAction,retry)",refset,callingController,completeAction,retry);

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		refsetsAdapter.update(user,refset).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				Bootstrap.NM.push('Refset Service : Refset updated', 'info');
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0});
				}
			}	
			else
			{
				_this.handleRequestFailure(response,'Update refset','updateRefset',[refset],callingController,completeAction,retryCounter);
			}
		});
	},
	
	addMembers : function(refsetId,members,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:addMembers (members,retry)",members,retry);

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

			if (typeof response.meta === "undefined" || typeof response.meta.errorInfo === 'undefined')
			{
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0,refsetId:refsetId,members:response.content.outcome});	
				}
				
				_this.getRefset(refsetId);
			}
			else
			{
				_this.handleRequestFailure(response,'Add members to refset','addMembers',[refsetId,members],callingController,completeAction,retryCounter);
			}
		});

		return result;
	},
	
	getMembers : function(members,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:getMembers (members,retry)",members,retry);

		var _this 			= this;
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
				_this.handleRequestFailure(response,'Get refset member details','getMembers',[members],callingController,completeAction,retryCounter);
				return {};
			}			
		});	
		
		return memberDetails;
	},
	
	getMember : function(id,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:getMember (id,retry)",id,retry);

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
				_this.handleRequestFailure(response,'Get refset memebr details','getMember',[id],callingController,completeAction,retryCounter);
				return {label:'not found'};
			}			
		});	
		
		return memberDetails;
	},
	
	deleteMembers : function(refsetId,members,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:deleteMembers (members,retry)",members,retry);

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user = loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		refsetsAdapter.deleteMembers(user,refsetId,members).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			_this.hideWaitAnim();

			if (typeof response.meta.errorInfo === 'undefined')
			{
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,response.content.outcome);
				}
				
				_this.getRefset(refsetId);		
			}
			else
			{
				_this.handleRequestFailure(response,'Delete refset members','deleteMembers',[refsetId,members],callingController,completeAction,retryCounter);
			}
		});	
	},
	
	getSnomedRefsetTypes : function(retry)
	{
		Ember.Logger.log("controllers.data:getSnomedRefsetTypes (retry)",retry);
		
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
		Ember.Logger.log("controllers.data:getSnomedModulesTypes (retry)",retry);
		
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
		Ember.Logger.log("controllers.data:getSnomedComponentTypes (retry)",retry);
		
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

	importRF2 : function(refsetId,rf2file,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:importRF2 (refsetId,retry)",refsetId,retry);

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);

		var loginController = this.get('controllers.login');
		var user 			= loginController.user;

		this.set("callsInProgressCounter",this.callsInProgressCounter+1);

		if (!retryCounter)
		{
			this.showWaitAnim();
		}
		
		var result = refsetsAdapter.importRF2(user,refsetId,rf2file).then(function(response)
		{
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			_this.hideWaitAnim();

			if (typeof response.meta === "undefined" || typeof response.meta.errorInfo === 'undefined')
			{
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0,refsetId:refsetId,rf2report:{}});	
				}
				
				_this.getRefset(refsetId);
			}
			else
			{
				_this.handleRequestFailure(response,'Import RF2','importRF2',[refsetId,rf2file],callingController,completeAction,retryCounter);
			}
		});

		return result;
	},
	
	searchRefsetMembers : function(searchTerm,callingController,completeAction,retry)
	{
		Ember.Logger.log("controllers.data:searchRefset (searchTerm,callingController,completeAction,retry)",searchTerm,callingController,completeAction,retry);

		var _this 			= this;
		var retryCounter 	= (typeof retry === "undefined" ? 0 : retry);
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		refsetsAdapter.searchRefsetMembers(user,searchTerm).then(function(response)
		{
			if (typeof response.meta.errorInfo === 'undefined')
			{
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,response);				
				}
			}	
			else
			{
				_this.handleRequestFailure(response,'Search refsets','searchRefset',[searchTerm],callingController,completeAction,retryCounter);
			}
		});
	},
	
});