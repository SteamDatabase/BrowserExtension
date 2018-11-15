'use strict';

// There's no easier way to check if we're on error page :(
if( document.title === 'Sorry!' || document.title === 'Error' )
{
	var link = document.createElement( 'a' );
	link.rel = 'noopener';
	link.href = 'https://steamstat.us';
	link.appendChild( document.createTextNode( 'Check steamstat.us' ) );
	
	var container = document.createElement( 'div' );
	container.className = 'steamdb_downtime_container';
	container.appendChild( document.createTextNode( 'Steam appears to be experiencing some downtime. ' ) );
	container.appendChild( link );
	
	var wrapper = document.createElement( 'div' );
	wrapper.className = 'steamdb_downtime';
	wrapper.appendChild( container );
	
	document.body.insertBefore( wrapper, document.body.firstChild );
	
	document.body.style.margin = 0;
}
else
{
	GetOption( { 'enhancement-hide-install-button': true, 'enhancement-no-linkfilter': false }, function( items )
	{
		if( items[ 'enhancement-hide-install-button' ] )
		{
			var button = document.querySelector( '.header_installsteam_btn' );
			
			if( button )
			{
				button.setAttribute( 'hidden', true );
				button.style.display = 'none';
			}
		}
		
		if( items[ 'enhancement-no-linkfilter' ] )
		{
			var links = document.querySelectorAll( 'a[href^="https://steamcommunity.com/linkfilter/"]' );
			
			for( var x = 0; x < links.length; x++ )
			{
				links[ x ].href = links[ x ].href.replace( /^https:\/\/steamcommunity\.com\/linkfilter\/(?:\?url=)?/, '' );
			}
		}
	} );

	const popup = document.querySelector( '#account_dropdown .popup_body' );

	if( popup )
	{
		const optionsLink = document.createElement( 'a' );
		optionsLink.target = '_blank';
		optionsLink.className = 'popup_menu_item';
		optionsLink.textContent = 'SteamDB Options';
		optionsLink.href = GetLocalResource( 'options/options.html' );

		popup.appendChild( optionsLink );
	}
}
