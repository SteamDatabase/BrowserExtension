'use strict';

GetOption( { 'enhancement-market-ssa': true }, function( items )
{
	if( items[ 'enhancement-market-ssa' ] )
	{
		const element = document.getElementById( 'accept_ssa' );

		if( element )
		{
			element.checked = true;
		}
	}
} );

const element = document.createElement( 'script' );
element.id = 'steamdb_registerkey_hook';
element.type = 'text/javascript';
element.src = GetLocalResource( 'scripts/store/registerkey_injected.js' );
element.dataset.icon = GetLocalResource( 'icons/white.svg' );
element.dataset.homepage = GetHomepage();

document.head.appendChild( element );
