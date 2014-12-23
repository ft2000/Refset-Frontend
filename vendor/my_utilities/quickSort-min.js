function swapArray(r,a,o){var t=r[a];r[a]=r[o],r[o]=t}function partition(r,a,o,t){var n=r[t].meta.score;swapArray(r,t,o-1);var s=a,i;for(i=a;o-1>i;++i)r[i].meta.score>=n&&(swapArray(r,s,i),++s);return swapArray(r,o-1,s),s}function qsort(r,a,o){if(o-1>a){var t=a+Math.floor(Math.random()*(o-a));t=partition(r,a,o,t),qsort(r,a,t),qsort(r,t+1,o)}}function quick_sort(r){qsort(r,0,r.length)}


var mergesort = function(array,sortBy,sortOrder)
{
	var len = array.length;
	  if(len < 2) { 
	    return array;
	  }
	  var pivot = Math.ceil(len/2);
	  return merge(mergesort(array.slice(0,pivot),sortBy,sortOrder), mergesort(array.slice(pivot),sortBy,sortOrder),sortBy,sortOrder);
	};

	var merge = function(left, right,sortBy,sortOrder) {
	  var result = [];
	  while((left.length > 0) && (right.length > 0))
	  {
		var x = left[0][sortBy];
		var y = right[0][sortBy];
				
		if (sortBy === "referencedComponentId" || sortBy === "moduleId" || sortBy === "numMembers" || sortBy === "sctId" || sortBy === "typeId")
		{
			x = Number.parseInt(left[0][sortBy],10);
			y = Number.parseInt(right[0][sortBy],10);
		}
		
		if (sortBy === "active")
		{
			x = left[0].active ? 1 : 0;
			y = right[0].active ? 1 : 0;
		}

		if (sortBy === "referencedComponent.active")
		{
			x = left[0].referencedComponent.active ? 1 : 0;
			y = right[0].referencedComponent.active  ? 1 : 0;
		}
		
		if (sortOrder === "desc")  
		{
		    if(x > y)
		    {
		      result.push(left.shift());
		    }
		    else {
		      result.push(right.shift());
		    }
		}
		else
		{
		    if(x > y)
		    {
			      result.push(right.shift());
		    }
		    else {
			      result.push(left.shift());
		    }	
		}
	  }

	  result = result.concat(left, right);
	  return result;
	};