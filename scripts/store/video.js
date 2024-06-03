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
		link.className = 'action_btn';
		link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
		link.appendChild( document.createTextNode( _t( 'view_on_steamdb' ) ) );

		container.insertBefore( link, null );
	}
} );
