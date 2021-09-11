'use strict';

GetOption( { 'button-gamehub': true }, function( items )
{
	if( !items[ 'button-gamehub' ] )
	{
		return;
	}

	const container = document.querySelector( '.review_app_actions' );

	if( !container )
	{
		return;
	}

	// image
	const image = document.createElement( 'img' );
	image.className = 'toolsIcon steamdb_ogg_icon';
	image.src = GetLocalResource( 'icons/white.svg' );

	// link
	const link = document.createElement( 'a' );
	link.rel = 'noopener';
	link.className = 'general_btn panel_btn';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
	link.appendChild( image );
	link.appendChild( document.createTextNode( 'View on SteamDB' ) );

	container.insertBefore( link, null );
} );
