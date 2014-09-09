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
				ret[s[0]] = /^\[^0]d+$/.test(v) ? Math.ceil(v) : v; // If our value is an integer value then force it to be numeric rather than a string
			}
		}
		return ret;
	},
	
	urldecode : function(str) 
	{
		   return decodeURIComponent((str+'').replace(/\+/g, '%20'));
	},
});