'use strict';

GetOption( { 'button-sub': true }, function( items )
{
	if( !items[ 'button-sub' ] )
	{
		return;
	}

	const container = document.querySelector( '.game_meta_data' );

	if( container )
	{
		let element = document.createElement( 'span' );
		element.appendChild( document.createTextNode( 'View on SteamDB' ) );

		const link = document.createElement( 'a' );
		link.rel = 'noopener';
		link.className = 'action_btn';
		link.href = GetHomepage() + 'bundle/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
		link.appendChild( element );

		element = document.createElement( 'div' );
		element.className = 'block';
		element.appendChild( link );

		container.insertBefore( element, container.firstChild );
	}
} );
