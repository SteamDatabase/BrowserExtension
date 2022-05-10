'use strict';

GetOption( {
	'enhancement-tradeoffer-url-items': true,
	'enhancement-tradeoffer-no-gift-confirm': null,
}, function( items )
{
	const element = document.createElement( 'script' );

	if( items[ 'enhancement-tradeoffer-no-gift-confirm' ] )
	{
		element.dataset.noGiftConfirm = 'true';
	}

	if( items[ 'enhancement-tradeoffer-url-items' ] )
	{
		element.dataset.urlItemSupport = 'true';
	}

	element.id = 'steamdb_tradeoffer';
	element.type = 'text/javascript';
	element.src = GetLocalResource( 'scripts/community/tradeoffer_injected.js' );

	document.head.appendChild( element );
} );
