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
	
	var cache = localStorage.getItem( 'userdata.cached' );
	
	var xhr = new XMLHttpRequest();
	xhr.open( 'GET', 'https://store.steampowered.com/dynamicstore/userdata/?_=' + cache, true );
	xhr.responseType = 'json';
	
	xhr.onerror = function()
	{
		TryToUseCachedData( );
		
		localStorage.setItem( 'userdata.cached', Date.now() );
		
		var id = document.createElement( 'div' );
		id.className = 'extension-warning';
		
		var icon = document.createElement( 'span' );
		icon.className = 'mega-octicon octicon-squirrel';
		
		id.appendChild( icon );
		id.appendChild( document.createTextNode( 'Failed to load game data from Steam store due to a network failure.' ) );
		
		document.body.appendChild( id );
	};
	
	xhr.onreadystatechange = function()
	{
		if( xhr.readyState !== 4 )
		{
			return;
		}
		
		if( xhr.status !== 200 || !xhr.response.rgOwnedPackages )
		{
			xhr.onerror();
			return;
		}
		
		if( !xhr.response.rgOwnedPackages.length )
		{
			TryToUseCachedData( );
			
			localStorage.setItem( 'userdata.cached', Date.now() );
			
			var id = document.createElement( 'a' );
			id.rel = 'noopener';
			id.className = 'extension-warning';
			id.href = 'https://store.steampowered.com/login/';
			
			var icon = document.createElement( 'span' );
			icon.className = 'mega-octicon octicon-hubot';
			
			id.appendChild( icon );
			id.appendChild( document.createTextNode( 'You are not logged in on Steam Store. Make sure third-party cookies for "store.steampowered.com" are enabled.' ) );
			
			document.body.appendChild( id );
			
			return;
		}
		
		OnDataLoaded( xhr.response );
		
		// TODO: This shouldn't be executed if browser cache was hit
		if( typeof chrome !== 'undefined' )
		{
			chrome.storage.local.set( { 'userdata.stored': JSON.stringify( xhr.response ) } );
		}
	};
	
	xhr.send();
} );
