'use strict';

GetOption( { 'options_steam_family_flag': true }, ( items ) =>
{
	if( !items.options_steam_family_flag )
	{
		return;
	}

	const element = document.createElement( 'script' );
	element.id = 'steamdb_family_shared';
	element.type = 'text/javascript';
	element.src = GetLocalResource( 'scripts/store/family_shared_injected.js' );
	element.dataset.i18n = JSON.stringify( {
		in_family: _t( 'in_family' ),
	} );

	document.head.appendChild( element );
} );
