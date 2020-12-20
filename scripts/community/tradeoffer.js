'use strict';

GetOption( { 'enhancement-tradeoffer-no-gift-confirm': null }, function( items )
{
	if( items[ 'enhancement-tradeoffer-no-gift-confirm' ] )
	{
		document.body.dataset.steamdbNoGiftConfirm = 'true';
	}
	const element = document.createElement( 'script' );

	element.id = 'steamdb_fix_tradeoffers';
	element.type = 'text/javascript';
	element.src = GetLocalResource( 'scripts/community/tradeoffer_injected.js' );

	document.head.appendChild( element );
} );
