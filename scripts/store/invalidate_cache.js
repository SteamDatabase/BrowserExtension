'use strict';

GetOption( { 'steamdb-highlight': true }, ( items ) =>
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}

	const element = document.createElement( 'script' );
	element.id = 'steamdb_invalidate_cache';
	element.type = 'text/javascript';
	element.src = GetLocalResource( 'scripts/store/invalidate_cache_injected.js' );

	document.head.appendChild( element );

	window.addEventListener( 'message', ( request ) =>
	{
		if( request && request.data && request.data.type === 'steamdb:extension-invalidate-cache' )
		{
			WriteLog( 'Invalidating userdata cache' );
			SendMessageToBackgroundScript( {
				contentScriptQuery: 'InvalidateCache',
			}, () =>
			{
				// noop
			} );
		}
	} );
} );
