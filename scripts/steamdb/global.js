/* global chrome:false */
/* TODO: Remove this global later for multi browser support */
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
	
	var TryToUseCachedData = function( )
	{
		if( typeof chrome === 'undefined' )
		{
			return;
		}
		
		chrome.storage.local.get( 'userdata.stored', function( data )
		{
			if( data[ 'userdata.stored' ] )
			{
				OnDataLoaded( JSON.parse( data[ 'userdata.stored' ] ) );
			}
		} );
	};
	
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
		cacheBust: localStorage.getItem( 'userdata.cached' ),
	}, ( response ) =>
	{
		if( !response || !response.rgOwnedPackages || !response.rgOwnedPackages.length )
		{
			WriteLog( 'Failed to load userdata', response.error );

			TryToUseCachedData( );
			
			localStorage.setItem( 'userdata.cached', Date.now() );
			
			var id = document.createElement( 'a' );
			id.rel = 'noopener';
			id.className = 'extension-warning';
			id.href = 'https://store.steampowered.com/login/';
			
			var icon = document.createElement( 'span' );
			icon.className = 'mega-octicon octicon-hubot';
			
			id.appendChild( icon );
			id.appendChild( document.createTextNode( response.error ?
				'Failed to load game data from Steam store due to a network failure.' :
				'You are not logged in on Steam Store.'
			) );
			
			document.body.appendChild( id );
			
			return;
		}
		
		OnDataLoaded( response );

		WriteLog( 'Userdata loaded', `Packages: ${response.rgOwnedPackages.length}` );
		
		// TODO: This shouldn't be executed if browser cache was hit
		if( typeof chrome !== 'undefined' )
		{
			chrome.storage.local.set( { 'userdata.stored': JSON.stringify( response ) } );
		}
	} );
} );
