'use strict';

document.querySelectorAll( '.remove_link' ).forEach( function( element )
{
	element.addEventListener( 'click', () =>
	{
		WriteLog( 'Invalidating userdata cache (remove from cart)' );

		SendMessageToBackgroundScript( {
			contentScriptQuery: 'InvalidateCache',
		}, () =>
		{
			// noop
		} );
	} );
} );
