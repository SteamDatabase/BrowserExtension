'use strict';

// There's no easier way to check if we're on error page :(
if( document.title === 'Sorry!' ||
document.title === 'Error' ||
document.title === '502 Bad Gateway' ||
document.title === 'We Broke It' )
{
	const link = document.createElement( 'a' );
	link.rel = 'noopener';
	link.href = 'https://steamstat.us';
	link.appendChild( document.createTextNode( 'Check steamstat.us' ) );

	const container = document.createElement( 'div' );
	container.className = 'steamdb_downtime';
	container.appendChild( document.createTextNode( 'Steam appears to be experiencing some downtime. ' ) );
	container.appendChild( link );

	document.body.insertBefore( container, document.body.firstChild );

	document.body.style.margin = 0;
}
else
{
	GetOption( { 'enhancement-hide-install-button': true, 'enhancement-no-linkfilter': false }, function( items )
	{
		if( items[ 'enhancement-hide-install-button' ] )
		{
			const button = document.querySelector( '.header_installsteam_btn' );

			if( button )
			{
				button.setAttribute( 'hidden', true );
				button.style.display = 'none';
			}
		}

		if( items[ 'enhancement-no-linkfilter' ] )
		{
			const links = document.querySelectorAll( 'a[href^="https://steamcommunity.com/linkfilter/"]' );

			for( let x = 0; x < links.length; x++ )
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
