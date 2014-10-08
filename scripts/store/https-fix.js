(function()
{
	var originalGetDefaultCommunityAJAXParams = window.GetDefaultCommunityAJAXParams;
	
	window.GetDefaultCommunityAJAXParams = function( path, method )
	{
		var rgParams = originalGetDefaultCommunityAJAXParams( path, method );
		
		console.log( rgParams.url );
		
		// Force https
		rgParams.url = rgParams.url.replace( /^http:/, 'https:' );
		
		return rgParams;
	};
}());
