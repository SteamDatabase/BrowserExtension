'use strict';

(function()
{
	var originalGetDefaultCommunityAJAXParams = window.GetDefaultCommunityAJAXParams;
	
	window.GetDefaultCommunityAJAXParams = function( path, method )
	{
		var rgParams = originalGetDefaultCommunityAJAXParams( path, method );
		
		// Force https
		rgParams.url = rgParams.url.replace( /^http:/, 'https:' );
		
		return rgParams;
	};
	
	var originalShowModalContent = window.ShowModalContent;
	
	window.ShowModalContent = function( url, titleBarText, titleBarURL, sizeToFit )
	{
		url = url.replace( /^http:/, 'https:' );
		titleBarText = titleBarText.replace( /^http:/, 'https:' );
		titleBarURL = titleBarURL.replace( /^http:/, 'https:' );
		
		originalShowModalContent( url, titleBarText, titleBarURL, sizeToFit );
	};
}());
