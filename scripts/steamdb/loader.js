( function( SteamDB )
{
	'use strict';
	
	if( !SteamDB || !( 'ExtensionUserdataLoaded' in SteamDB ) )
	{
		return;
	}
	
	var element = document.getElementById( 'steamdb_userdata_loaded' );
	var data = JSON.parse( element.dataset.data );
	var hideNotInterested = element.dataset.hideNotInterested;
	
	document.head.removeChild( element );
	
	for( var i = 0; i < SteamDB.ExtensionUserdataLoaded.length; i++ )
	{
		SteamDB.ExtensionUserdataLoaded[ i ]( data, {
			hideNotInterested: hideNotInterested
		} );
	}
}( window.SteamDB ) );
