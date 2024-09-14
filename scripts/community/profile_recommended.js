'use strict';

GetOption( { 'button-gamehub': true }, ( items ) =>
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
	link.className = 'general_btn panel_btn';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
	link.appendChild( image );
	link.appendChild( document.createTextNode( _t( 'view_on_steamdb' ) ) );

	container.insertBefore( link, null );
} );
