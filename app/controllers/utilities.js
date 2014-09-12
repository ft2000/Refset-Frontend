export default Ember.ObjectController.extend({

	deserialiseURLString: function(p)
	{
		var ret = {};
		
		if (p !== null)
		{
			var seg = p.replace(/^\?/,'').split('&');
		    var len = seg.length, i = 0;
			for (;i<len;i++) 
			{
				if (!seg[i]) { continue; }
				var s = seg[i].split('=');
				var v = this.urldecode(s[1]);
				ret[s[0]] = /^\[^0]d+$/.test(v) ? Math.ceil(v) : v == "null" ? null : v; // If our value is an integer value then force it to be numeric rather than a string
			}
		}
		return ret;
	},
	
	urldecode : function(str) 
	{
		return decodeURIComponent((str+'').replace(/\+/g, '%20'));
	},
	
	serialiseObject : function(object)
	{
		var URLSerialisedData = "";
		
		for (var key in object)
		{
			if (object.hasOwnProperty(key) && key !== "toString")
			{
				if (URLSerialisedData !== "") 
			    {
			    	URLSerialisedData += "&";
			    }
			    
			    URLSerialisedData += key + "=" + object[key];
			}
		}
		
		return URLSerialisedData;
	},
	
	storeDataInSessionStore : function(key,data)
	{
		var URLSerialisedData = JSON.stringify(data);
		sessionStoreManager.setSessionVar(key,URLSerialisedData);		
	},
	
	getDataFromSessionStore : function(key)
	{
		var returnObj = {};
		
		var storedData = sessionStoreManager.getSessionVar(key);

		if (typeof storedData !== "undefined")
		{
			try
			{
				returnObj.data 		= JSON.parse(storedData);
				returnObj.status 	= 'ok';
			}
			catch(e)
			{
				returnObj.status 	= 'error';				
			}
		}
		else
		{
			returnObj.status = 'error';
		}
			
		return returnObj;
	},
});