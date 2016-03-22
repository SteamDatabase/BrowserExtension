( function()
{
	'use strict';
	
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
	
	var originalRecordAJAXPageView = window.RecordAJAXPageView;
	
	window.RecordAJAXPageView = function RecordAJAXPageView( url )
	{
		originalRecordAJAXPageView( url );
		
		// Fix links in ajax loaded content
		var i, elements = document.querySelectorAll( 'a[href^="http://steamcommunity.com"]' );
		
		for( i = 0; i < elements.length; i++ )
		{
			elements[ i ].href = elements[ i ].href.replace( /^http:/, 'https:' );
		}
		
		// Find all forms
		elements = document.querySelectorAll( 'form[action^="http://steamcommunity.com"]' );
		
		for( i = 0; i < elements.length; i++ )
		{
			elements[ i ].action = elements[ i ].action.replace( /^http:/, 'https:' );
		}
	};
}() );
