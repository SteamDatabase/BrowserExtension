'use strict';

GetOption( { 'button-sub': true }, ( items ) =>
{
	if( !items[ 'button-sub' ] )
	{
		return;
	}

	const container = document.querySelector( '.game_meta_data' );

	if( container )
	{
		let element = document.createElement( 'span' );
		element.appendChild( document.createTextNode( _t( 'view_on_steamdb' ) ) );

		const link = document.createElement( 'a' );
		link.className = 'action_btn';
		link.href = GetHomepage() + 'bundle/' + GetCurrentAppID() + '/';
		link.appendChild( element );

		element = document.createElement( 'div' );
		element.className = 'block';
		element.appendChild( link );

		container.insertBefore( element, container.firstChild );
	}
} );
