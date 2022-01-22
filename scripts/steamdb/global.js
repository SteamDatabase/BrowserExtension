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
						response,
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

GetOption( { 'steamdb-highlight': true }, function( items )
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}

	SendMessageToBackgroundScript( {
		contentScriptQuery: 'FetchSteamUserData',
	}, ( response ) =>
	{
		if( response.error )
		{
			WriteLog( 'Failed to load userdata', response.error );

			window.postMessage( {
				type: 'steamdb:extension-error',
				error: `Failed to load your games. ${response.error}`,
			}, GetHomepage() );
		}

		if( response.data )
		{
			window.postMessage( {
				type: 'steamdb:extension-loaded',
				data: response.data,
			}, GetHomepage() );

			WriteLog( 'Userdata loaded', `Packages: ${response.data.rgOwnedPackages.length}` );
		}
	} );
} );
