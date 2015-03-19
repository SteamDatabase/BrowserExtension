'use strict';

// There's no easier way to check if we're on error page :(
if( document.title === 'Sorry!' || document.title === 'Error' )
{
	var link = document.createElement( 'a' );
	link.href = 'https://steamstat.us';
	link.target = '_blank';
	link.appendChild( document.createTextNode( 'Check steamstat.us' ) );
	
	var element = document.createElement( 'div' );
	element.className = 'steamdb_downtime_container';
	element.appendChild( document.createTextNode( 'Steam appears to be experiencing some downtime. ' ) );
	element.appendChild( link );
	
	var container = document.createElement( 'div' );
	container.className = 'steamdb_downtime';
	container.appendChild( element );
	
	document.body.insertBefore( container, document.body.firstChild );
	
	document.body.style.margin = 0;
}
else
{
	GetOption( { 'enhancement-hide-install-button': false, 'enhancement-https-fix': false }, function( items )
	{
		if( items[ 'enhancement-hide-install-button' ] )
		{
			var element = document.querySelector( '.header_installsteam_btn' );
			
			if( element )
			{
				element.setAttribute( 'hidden', true );
			}
		}
		
		if( items[ 'enhancement-https-fix' ] )
		{
			// Don't apply fixes if visiting steamcommunity on http (stuff like broadcasts simply wont work on https)
			if( location.hostname === 'steamcommunity.com' && location.protocol !== 'https:' )
			{
				return;
			}
			
			// Find all community links starting with http:// and just change them to https://
			// Scripts already have https:// in them whenever you visit community on https
			var elements = document.querySelectorAll( 'a[href^="http://steamcommunity.com"]' ),
			    length = elements.length, i;
			
			for( i = 0; i < length; i++ )
			{
				elements[ i ].href = elements[ i ].href.replace( /^http:/, 'https:' );
			}
			
			// Find all forms
			elements = document.querySelectorAll( 'form[action^="http://steamcommunity.com"]' );
			length = elements.length;
			
			for( i = 0; i < length; i++ )
			{
				elements[ i ].action = elements[ i ].action.replace( /^http:/, 'https:' );
			}
			
			var element = document.createElement( 'script' );
			element.id = 'steamdb_https_fix';
			element.type = 'text/javascript';
			element.src = GetLocalResource( 'scripts/https-fix.js' );
			element.dataset.homepage = GetHomepage();
			
			document.head.appendChild( element );
			
			// Fix super(shitty)nav links
			elements = document.querySelectorAll( '.supernav' );
			length = elements.length;
			
			for( i = 0; i < length; i++ )
			{
				elements[ i ].dataset.tooltipContent = elements[ i ].dataset.tooltipContent.replace( /http:\/\/steamcommunity\.com/g, 'https://steamcommunity.com' );
			}
		}
	} );
}
