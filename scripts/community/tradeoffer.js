'use strict';

GetOption( { 'enhancement-tradeoffer-no-gift-confirm': null }, function( items )
{
	const element = document.createElement( 'script' );

	if( items[ 'enhancement-tradeoffer-no-gift-confirm' ] )
	{
		element.dataset.steamdbNoGiftConfirm = 'true';
	}

	element.id = 'steamdb_tradeoffer';
	element.type = 'text/javascript';
	element.src = GetLocalResource( 'scripts/community/tradeoffer_injected.js' );

	document.head.appendChild( element );
} );
