'use strict';

var element = document.getElementById( 'steamdb-extension-protip' );

if( element )
{
	element.setAttribute( 'hidden', true );
}

GetOption( { 'steamdb-highlight': true, 'steamdb-hide-not-interested': false }, function( items )
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}
	
	var OnDataLoaded = function( data )
	{
		element = document.createElement( 'script' );
		element.id = 'steamdb_userdata_loaded';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/steamdb/loader.js' );
		element.dataset.data = JSON.stringify( data );
		element.dataset.hideNotInterested = !!items[ 'steamdb-hide-not-interested' ];
		
		document.head.appendChild( element );
	};
	
	SendMessageToBackgroundScript( {
		contentScriptQuery: 'FetchSteamUserData',
	}, ( response ) =>
	{
		if( response.error )
		{
			WriteLog( 'Failed to load userdata', response.error );
			
			const warning = document.createElement( 'div' );
			warning.className = 'extension-warning';

			warning.appendChild( document.createTextNode( 'Failed to load game data from Steam.' ) );
			warning.appendChild( document.createElement( 'br' ) );
			warning.appendChild( document.createTextNode( response.error ) );

			const btn = document.createElement( 'a' );
			btn.className = 'btn btn-sm btn-primary';
			btn.href = 'https://store.steampowered.com/login/';
			btn.textContent = 'Sign in on the Steam Store';

			const btnDiv = document.createElement( 'div' );
			btnDiv.appendChild( btn );
			warning.appendChild( btnDiv );
			document.body.appendChild( warning );
		}
		
		if( response.data )
		{
			OnDataLoaded( response.data );

			WriteLog( 'Userdata loaded', `Packages: ${response.data.rgOwnedPackages.length}` );
		}
	} );
} );
