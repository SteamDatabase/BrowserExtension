(function(callbacks)
{
	'use strict';
	
	var element = document.getElementById( 'steamdb_userdata_loaded' );
	var data = JSON.parse( element.dataset.data );
	var hideNotInterested = element.dataset.hideNotInterested;
	
	document.head.removeChild( element );
	
	for( var i = 0; i < callbacks.length; i++ )
	{
		callbacks[ i ]( data, {
			hideNotInterested: hideNotInterested
		} );
	}
}(SteamDB.ExtensionUserdataLoaded));
