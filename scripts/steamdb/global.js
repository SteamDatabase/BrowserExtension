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

GetOption( { 'steamdb-highlight': true }, ( items ) =>
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}

	SendMessageToBackgroundScript( {
		contentScriptQuery: 'FetchSteamUserData',
	}, ( response ) =>
	{
		const OnPageLoaded = () =>
		{
			if( response.error )
			{
				WriteLog( 'Failed to load userdata', response.error );

				window.postMessage( {
					version: EXTENSION_INTEROP_VERSION,
					type: 'steamdb:extension-error',
					error: `Failed to load your games. ${response.error}`,
				}, GetHomepage() );
			}

			if( response.data )
			{
				window.postMessage( {
					version: EXTENSION_INTEROP_VERSION,
					type: 'steamdb:extension-loaded',
					data: response.data,
				}, GetHomepage() );

				WriteLog( 'Userdata loaded', `Packages: ${response.data.rgOwnedPackages.length}` );
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

	// Maybe it should be its own option?
	SendMessageToBackgroundScript( {
		contentScriptQuery: 'FetchSteamUserFamilyData',
	}, ( response ) =>
	{
		const OnPageLoaded = () =>
		{
			if( response.error )
			{
				if( response.error === 'You are not part of any family group.' )
				{
					WriteLog( response.error );
				}
				else
				{
					WriteLog( 'Failed to load family userdata', response.error );

					window.postMessage( {
						version: EXTENSION_INTEROP_VERSION,
						type: 'steamdb:extension-error',
						error: `Failed to load your family games. ${response.error}`,
					}, GetHomepage() );
				}

			}

			if( response.data )
			{
				window.postMessage( {
					version: EXTENSION_INTEROP_VERSION,
					type: 'steamdb:extension-loaded',
					data: response.data,
				}, GetHomepage() );

				WriteLog( 'UserFamilydata loaded', `Apps: ${response.data.rgFamilySharedApps.length}` );
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
} );
