'use strict';

const element = document.getElementById( 'steamdb-extension-protip' );

if( element )
{
	element.setAttribute( 'hidden', true );
}

window.addEventListener( 'message', ( request ) =>
{
	if( !request || !request.data || request.origin !== window.location.origin )
	{
		return;
	}

	switch( request.data.type )
	{
		case 'steamdb:extension-query':
		{
			if( request.data.contentScriptQuery )
			{
				SendMessageToBackgroundScript( request.data, ( response ) =>
				{
					window.postMessage( {
						type: 'steamdb:extension-response',
						request: request.data,
						response: response,
					}, GetHomepage() );
				} );
			}
			break;
		}
		case 'steamdb:extension-invalidate-cache':
		{
			WriteLog( 'Invalidating userdata cache' );
			SendMessageToBackgroundScript( {
				contentScriptQuery: 'InvalidateCache',
			}, () =>
			{
				// noop
			} );
			break;
		}
	}
} );

GetOption( { 'steamdb-highlight': true, 'steamdb-hide-not-interested': false }, function( items )
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}

	const OnDataLoaded = function( data )
	{
		window.postMessage( {
			type: 'steamdb:extension-loaded',
			data: data,
			options: {
				hideNotInterested: !!items[ 'steamdb-hide-not-interested' ],
			},
		}, GetHomepage() );
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
