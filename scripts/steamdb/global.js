'use strict';

const EXTENSION_INTEROP_VERSION = 2;

const OnPageLoadedInit = () =>
{
	window.postMessage( {
		version: EXTENSION_INTEROP_VERSION,
		type: 'steamdb:extension-init',
		data: {
			options_url: GetLocalResource( 'options/options.html' ),
		},
	}, GetHomepage() );
};

if( document.readyState === 'loading' )
{
	document.addEventListener( 'DOMContentLoaded', OnPageLoadedInit, { once: true } );
}
else
{
	OnPageLoadedInit();
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
						version: EXTENSION_INTEROP_VERSION,
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

GetOption( { 'steamdb-highlight': true, 'steamdb-highlight-family': true }, ( items ) =>
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}

	Promise.all( [
		new Promise( ( resolve ) =>
		{
			SendMessageToBackgroundScript( {
				contentScriptQuery: 'FetchSteamUserData',
			}, ( response ) =>
			{
				resolve( response );
			} );
		} ),
		new Promise( ( resolve ) =>
		{
			if( !items[ 'steamdb-highlight-family' ] )
			{
				// ! this is probably a bad idea maybe returning an empty object is better
				resolve( null );
			}
			SendMessageToBackgroundScript( {
				contentScriptQuery: 'FetchSteamUserFamilyData',
			}, ( response ) =>
			{
				resolve( response );
			} );
		} ),
	] ).then( ( responses ) =>
	{
		if( responses[ 0 ]?.error )
		{
			WriteLog( 'Failed to load userdata', responses[ 0 ].error );
		}

		if( responses[ 1 ]?.error )
		{
			if( responses[ 1 ].error === 'You are not part of any family group.' )
			{
				WriteLog( responses[ 1 ].error );
			}
			else
			{
				WriteLog( 'Failed to load family userdata', responses[ 1 ].error );

				// window.postMessage( {
				// 	version: EXTENSION_INTEROP_VERSION,
				// 	type: 'steamdb:extension-error',
				// 	error: `Failed to load your family games. ${response.error}`,
				// }, GetHomepage() );
			}
		}
		let response;
		const log = [];
		if( responses[ 0 ].data )
		{
			response = responses[ 0 ].data;
			log.push( `Packages: ${response.rgOwnedPackages.length}` );
		}
		if( responses[ 0 ].data && responses[ 1 ].data )
		{
			response.rgFamilySharedApps =  responses[ 1 ].data?.rgFamilySharedApps.reduce( ( data, app ) =>
			{
				if( !app.owner_steamids.includes( responses[ 1 ].data?.owner_steamid ) )
				{
					data.push( app.appid );
				}
				else if( !response.rgOwnedApps[ app.appid ] )
				{
					response.rgOwnedApps.push( app.appid );
				}
				return data;
			}, [] );
			log.push( `Family Apps: ${response.rgFamilySharedApps.length}` );
		}

		const OnPageLoaded = () =>
		{
			if( response )
			{
				console.log( response );
				window.postMessage( {
					version: EXTENSION_INTEROP_VERSION,
					type: 'steamdb:extension-loaded',
					data: response,
				}, GetHomepage() );
				WriteLog( 'Userdata loaded', log.join( ', ' ) );
			}
		};

		if( document.readyState === 'loading' )
		{
			document.addEventListener( 'DOMContentLoaded', OnPageLoaded, { once: true } );
		}
		else
		{
			OnPageLoaded();
		}
	} );
}
);
