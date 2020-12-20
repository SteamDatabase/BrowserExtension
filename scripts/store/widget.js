'use strict';

GetOption( { 'link-subid-widget': true }, function( items )
{
	if( !items[ 'link-subid-widget' ] )
	{
		return;
	}

	let subid = document.querySelector( 'input[name="subid"]' );

	if( subid )
	{
		subid = subid.value;

		const subidElement = document.createElement( 'i' );
		subidElement.className = 'steamdb_subid';
		subidElement.appendChild( document.createTextNode( '(' + subid + ')' ) );

		const link = document.createElement( 'a' );
		link.rel = 'noopener';
		link.target = '_blank';
		link.className = 'steamdb_link';
		link.href = GetHomepage() + 'sub/' + subid + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
		link.appendChild( document.createTextNode( 'View on Steam Database ' ) );
		link.appendChild( subidElement );

		const container = document.createElement( 'p' );
		container.appendChild( link );

		document.querySelector( '.desc' ).appendChild( container );
	}
} );
