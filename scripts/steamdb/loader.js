( function( SteamDB )
{
	'use strict';
	
	if( !SteamDB || !( 'ExtensionUserdataLoaded' in SteamDB ) )
	{
		return;
	}
	
	const element = document.getElementById( 'steamdb_userdata_loaded' );
	const data = JSON.parse( element.dataset.data );
	const hideNotInterested = element.dataset.hideNotInterested;
	
	document.head.removeChild( element );
	
	for( let i = 0; i < SteamDB.ExtensionUserdataLoaded.length; i++ )
	{
		SteamDB.ExtensionUserdataLoaded[ i ]( data, {
			canHandleStoreButtons: true,
			hideNotInterested: hideNotInterested,
		} );
	}
}( window.SteamDB ) );
