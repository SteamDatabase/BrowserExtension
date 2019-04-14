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
			
			var id = document.createElement( 'a' );
			id.rel = 'noopener';
			id.className = 'extension-warning';
			id.href = 'https://store.steampowered.com/login/';
			
			var icon = document.createElement( 'span' );
			icon.className = 'mega-octicon octicon-hubot';
			
			id.appendChild( icon );
			id.appendChild( document.createTextNode(
				`Failed to load game data from Steam store. (${response.error})`
			) );
			
			document.body.appendChild( id );
		}
		
		if( response.data )
		{
			OnDataLoaded( response.data );

			WriteLog( 'Userdata loaded', `Packages: ${response.data.rgOwnedPackages.length}` );
		}
	} );
} );
