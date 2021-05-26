( function()
{
	'use strict';

	if( !window.GDynamicStore || !window.GDynamicStore.InvalidateCache )
	{
		return;
	}

	const originalGDynamicStoreInvalidateCache = window.GDynamicStore.InvalidateCache;

	window.GDynamicStore.InvalidateCache = function SteamDB_GDynamicStore_InvalidateCache()
	{
		originalGDynamicStoreInvalidateCache.apply( this, arguments );

		window.postMessage( {
			type: 'steamdb:extension-invalidate-cache',
		}, window.location.origin );
	};
}() );
