export default Ember.ObjectController.extend({
		
	needs 			: ["data","login"],

	refsetTypesArray 			: Ember.computed.alias("controllers.data.refsetTypesArray"),
	componentTypesArray 		: Ember.computed.alias("controllers.data.componentTypes"),
	moduleTypesArray 			: Ember.computed.alias("controllers.data.moduleTypes"),
	languageTypesArray 			: Ember.computed.alias("controllers.data.languageTypes"),
	refsetEffectiveTimesArray 	: Ember.computed.alias("controllers.data.refsetEffectiveTimesArray"),
	refsetUpdatersArray 		: Ember.computed.alias("controllers.data.refsetUpdatersArray"),
	refsets						: Ember.computed.alias("controllers.data.refsets"),
	user 						: Ember.computed.alias("controllers.login.user"),
	
	sortBy 							: 'description',
	sortOrder						: 'asc',

	filterByDescription				: '',
	filterByStatus					: -1,
	filterByType					: -1,
	filterByModuleId				: -1,
	filterByComponentType			: -1,
	filterByLanguage				: -1,
	filterByEffectiveTime			: -1,
	filterByLastUpdateDate			: -1,
	filterByLastUpdateUser			: -1,
	
	filterByStatusIsActive			: function(){ return this.filterByStatus !== -1;}.property('filterByStatus'),
	filterByTypeIsActive			: function(){ return this.filterByType !== -1;}.property('filterByType'),
	filterByModuleIdIsActive		: function(){ return this.filterByModuleId !== -1;}.property('filterByModuleId'),
	filterByComponentTypeIsActive	: function(){ return this.filterByComponentType !== -1;}.property('filterByComponentType'),
	filterByLanguageIsActive		: function(){ return this.filterByLanguage !== -1;}.property('filterByLanguage'),
	filterByEffectiveTimeIsActive	: function(){ return this.filterByEffectiveTime !== -1;}.property('filterByEffectiveTime'),
	filterByLastUpdateDateIsActive	: function(){ return this.filterByLastUpdateDate !== -1;}.property('filterByLastUpdateDate'),
	filterByLastUpdateUserIsActive	: function(){ return this.filterByLastUpdateUser !== -1;}.property('filterByLastUpdateUser'),

	filteredRefsets : function()
	{
		var allRefsets = this.get('refsets');
		
		return this.filterRefsets(allRefsets);
		
	}.property('refsets.@each','sortBy','sortOrder','filterByDescription','filterByStatus','filterByType','filterByModuleId','filterByComponentType','filterByLanguage','filterByEffectiveTime','filterByLastUpdateDate','filterByLastUpdateUser'),
	
	filterRefsets : function(allRefsets)
	{
		if (typeof allRefsets !== "undefined")
		{
			var filterByDescription 	= this.get("filterByDescription");
			var filterByStatus			= this.get("filterByStatus");
			var filterByType			= this.get("filterByType");
			var filterByModuleId		= this.get("filterByModuleId");
			var filterByComponentType	= this.get("filterByComponentType");
			var filterByLanguage		= this.get("filterByLanguage");
			var filterByEffectiveTime	= this.get("filterByEffectiveTime");
			var filterByLastUpdateDate	= this.get("filterByLastUpdateDate");
			var filterByLastUpdateUser	= this.get("filterByLastUpdateUser");

			var filteredRefsets = allRefsets.map(function(refset)
			{
				if (typeof refset !== "undefined")
				{
					if (filterByStatus !== -1)
					{
						if (refset.meta.status !== filterByStatus)
						{
							return null;
						}
					}
					
					if (filterByType !== -1)
					{
						if (refset.typeId !== filterByType)
						{
							return null;
						}
					}

					if (filterByModuleId !== -1)
					{
						if (refset.moduleId !== filterByModuleId)
						{
							return null;
						}
					}

					if (filterByComponentType !== -1)
					{
						if (refset.componentTypeId !== filterByComponentType)
						{
							return null;
						}
					}

					if (filterByLanguage !== -1)
					{
						if (refset.languageCode !== filterByLanguage)
						{
							return null;
						}
					}

					if (filterByEffectiveTime !== -1)
					{
						if (refset.latestEffectiveTime !== filterByEffectiveTime)
						{
							return null;
						}
					}
				
					if (filterByLastUpdateDate !== -1)
					{
						var comparisonDate = new Date(filterByLastUpdateDate);
						
						if (comparisonDate instanceof Date && !isNaN(comparisonDate.valueOf()))
						{
							if (new Date(refset.modifiedDate).getTime() < comparisonDate.getTime())
							{
								return null;
							}
						}
					}
					
					if (filterByLastUpdateUser !== -1)
					{
						if (refset.modifiedBy !== filterByLastUpdateUser)
						{
							return null;
						}
					}
					
					var score;
					
					if (filterByDescription !== '')
					{
						if (filterByDescription.match(/^[0-9]*$/))
						{
							var regExp = new RegExp(filterByDescription,"g");
							score = refset.sctId.search(regExp);
							
							if (score === -1)
							{
								return null;
							}
							else
							{
								refset.meta.score = 100 - score;
							}
						}
						else
						{
							score = LiquidMetal.score(refset.description, filterByDescription);

							if (score < 0.75)
							{
								return null;								
							}
							else
							{
								refset.meta.score = score;
							}
						}
					}
					
					return refset;	
				}
 
			});

			var nullsRemoved = $.grep(filteredRefsets,function(n){ return(n); });			
			var sortBy 		= this.get("sortBy");
			var sortOrder 	= this.get("sortOrder");
			
			if (filterByDescription !== '' && sortOrder === "score" && (sortBy === "description" || sortBy === "sctId"))
			{
				quick_sort(nullsRemoved);
			}
			else
			{
				nullsRemoved = mergesort(nullsRemoved,sortBy,sortOrder);
			}
			
			return nullsRemoved;
		}	
	},
	
	
	initModel : function()
	{
		Ember.Logger.log("controllers.refsets.index:initModel");
		
		var _this 			= this;
		var dataController 	= this.get('controllers.data');
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function(){dataController.getAllRefsets(_this,'getAllRefsetsComplete');});
	},
	
	actions :
	{
		refresh : function()
		{
			Ember.Logger.log("controllers.refsets.index:actions:refresh");
			var dataController = this.get('controllers.data');
			dataController.getAllRefsets();
		},

		getAllRefsetsComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.index:actions:getAllRefsetsComplete (response)",response);
		},	
		
		addFilter : function()
		{
			Ember.Logger.log("controllers.refsets.refset:actions:addFilter");
			
			var filterName = $('#filterSelect').val();
			
			Ember.Logger.log(filterName);
			
			var defaultValue = true;
			
			var refsets 					= this.get("refsets");
			var refsetEffectiveTimesArray 	= this.get("refsetEffectiveTimesArray");
			var refsetUpdatersArray 		= this.get("refsetUpdatersArray");
			
			switch(filterName)
			{
				case 'filterByStatus' 			: {defaultValue = 'published'; break;}
				case 'filterByType' 			: {defaultValue = refsets[0].typeId; break;}
				case 'filterByModuleId' 		: {defaultValue = refsets[0].moduleId; break;}
				case 'filterByComponentType' 	: {defaultValue = refsets[0].componentTypeId; break;}
				case 'filterByLanguage' 		: {defaultValue = refsets[0].languageCode; break;}
				case 'filterByEffectiveTime' 	: {defaultValue = refsetEffectiveTimesArray[0].id; break;}
				case 'filterByLastUpdateDate' 	: {defaultValue = ''; break;}
				case 'filterByLastUpdateUser' 	: {defaultValue = refsetUpdatersArray[0].id; break;}
			}
		
			this.set(filterName,defaultValue);
			
			$('#filterSelect').val(0);
		},

		removeFilter : function(filterName)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:removeFilter",filterName);
			
			this.set(filterName,-1);
			
			var _this = this;
			
			Ember.run.next(function()
			{
				_this.set(filterName,-1); // deals with selects changing the value again!
			});			
		},
		
		setSortCriteria : function(sortBy)
		{
			var oldSortBy 			= this.get("sortBy");
			var oldSortOrder 		= this.get("sortOrder");
			var filterByDescription	= this.get("filterByDescription");

			var sortOrder = "asc";

			if (oldSortBy === sortBy)
			{
				switch (oldSortOrder)
				{
					case "asc":
					{
						sortOrder = "desc";
						break;
					}

					case "desc":
					{						
						if (sortBy === "description" && filterByDescription !== "")
						{
							sortOrder = "score";
						}
						break;
					}	
				}
			}
			else
			{
				if (sortBy === "description" && filterByDescription !== "")
				{
					sortOrder = "score";
				}
			}
			
			this.set("sortBy",sortBy);
			this.set("sortOrder",sortOrder);
		},
		
		clearDescriptionFilter : function()
		{
			this.set("filterByDescription","");
			this.set("sortOrder","asc");
		},
		
		setSortToBestMatch : function()
		{
			Ember.Logger.log("setSortToBestMatch");
			this.set("sortOrder","score");
		}
	}
	
});
