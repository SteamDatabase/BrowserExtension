'use strict';

GetOption( { 'button-video': true }, function( items )
{
	if( !items[ 'button-video' ] )
	{
		return;
	}

	const container = document.querySelector( '.game_details .block_content_inner' );

	if( container )
	{
		const link = document.createElement( 'a' );
		link.rel = 'noopener';
		link.className = 'action_btn';
		link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
		link.appendChild( document.createTextNode( 'View on SteamDB' ) );

		container.insertBefore( link, null );
	}
} );
