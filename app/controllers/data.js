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

	effectiveTimeArray			: function()
	{
		var times = [];
		
		var members = this.get("refset.members");
		
		for (var m=0;m<members.length;m++)
		{
			var effTime = members[m].effectiveTime;
					
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
    				callingController.send(completeAction,{error:1,unauthorised:1});
				}
				
				return;
			}

			case "404":
			{
				// Not found
				Bootstrap.GNM.push('Not found','We cannot locate the ' + resourceType + ' you have requested.', 'warning');

				_this.hideWaitAnim();
				
				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
				{
    				callingController.send(completeAction,{error:1,notFound:1});
				}

				return;
			}
			
			case "400":
			{
				// Bad Request
				Bootstrap.GNM.push('Bad Request','Server rejected our request', 'warning');

				_this.hideWaitAnim();
				
				BootstrapDialog.show({
		            title: 'Bad Request : ' + resourceType,
		            closable: false,
		            message: '<p>There has been a problem communicating with the server.</p><p>' + response.meta.errorInfo.message + '</p>',
		            buttons: 
		            [
		             	{
		             		label: 'OK',
		             		action: function(dialog)
		             		{
		             			_this.hideWaitAnim();
		        				
		             			Ember.Logger.log("closing window",callingController,completeAction);
		             			
		             			
		        				if (typeof callingController !== "undefined" && typeof completeAction !== "undefined")
		        				{
		            				callingController.send(completeAction,{error:1,requestError:1});
		        				}
		        				
		             			dialog.close();
		             		}
		             	}
		             ]
		        });

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
				var inactiveArray 		= [];
				
				_this.refsets.setObjects(response);
				
				response.content.refsets.map(function(item)
				{
					Ember.Logger.log("item.description",item.description, item.active);
					
					if (item.active)
					{
						if (item.published)
						{
							publishedArray.push(item);
						}
						else
						{
							unpublishedArray.push(item);					
						}
					}
					else
					{
						inactiveArray.push(item);
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

				var sortedInactiveArray = inactiveArray.sort(function(a,b)
				{
				    return new Date(b.publishedDate) - new Date (a.publishedDate);
				});			

				_this.inactiveRefsets.setObjects(sortedInactiveArray);
						
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0});
				}
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
			_this.set("callsInProgressCounter",_this.callsInProgressCounter-1);

			if (typeof response.meta.errorInfo === 'undefined')
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
					end = Math.min(start + 99,response.content.refset.totalNoOfMembers);
					
					if (start === 0) {end = 24;}
					
					idArraySlices.push({from:start,to:end});
					
					start = end + 1;
				}
				
				_this.refsetMemberRequestQueue.setObjects(idArraySlices);
				
				_this.processRefsetMemberRequestQueue(user,id);
								
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
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
	
	processRefsetMemberRequestQueue : function(user,id)
	{
		var _this = this;
		
		if (this.refsetMemberRequestQueue.length)
		{
			var membersToProcess = this.refsetMemberRequestQueue.shift();
	
			Ember.Logger.log("getting member data");
			
			var promise = this.getRefsetMembers(user,id,membersToProcess.from,membersToProcess.to).then(function(response)
			{
				if (response.error)
				{
					Ember.Logger.log("processRefsetMemberRequestQueue error",response);
				}
			});
		}
		
		Ember.RSVP.all([promise]).then(function(response)
		{
			if (_this.refsetMemberRequestQueue.length)
			{
				_this.processRefsetMemberRequestQueue(user,id)
			}
		});
	},
	
	getRefsetMembers : function(user,id,from,to)
	{	
		var _this = this;
		
		return refsetsAdapter.findMembers(user,id,from,to).then(function(response)
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
			
			Ember.Logger.log("got member data");
			
			if (_this.refset.members.length === _this.refset.totalNoOfMembers)
			{
				_this.set("refset.meta.allMembersLoaded",true);
			}
			
			return {error:false};
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
				
				if (typeof callingController !== "undefined" && typeof completeAction !== 'undefined')
				{
					callingController.send(completeAction,{error:0,id:refset.id});				
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
				Bootstrap.GNM.push('Refset Service','Refset deleted', 'info');

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
				Bootstrap.GNM.push('Refset Service','Refset updated', 'info');
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
	
});