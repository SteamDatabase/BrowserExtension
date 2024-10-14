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
				resolve( {} );
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
		const [ UserData, UserFamilyData ] = responses;

		if( UserData?.error )
		{
			WriteLog( 'Failed to load userdata', UserData.error );
		}

		if( UserFamilyData?.error )
		{
			if( UserFamilyData.error === 'You are not part of any family group.' )
			{
				WriteLog( UserFamilyData.error );
			}
			else
			{
				WriteLog( 'Failed to load family userdata', UserFamilyData.error );
			}
		}
		let response;
		const log = [];
		if( UserData.data )
		{
			response = UserData.data;
			log.push( `Packages: ${response.rgOwnedPackages.length}` );

			if( UserFamilyData.data )
			{
				response.rgFamilySharedApps =  UserFamilyData.data?.rgFamilySharedApps;
				if( UserFamilyData.data?.rgOwnedPackages )
				{
					response.rgOwnedApps = [ ... new Set( [ ...response.rgOwnedApps, ...UserFamilyData.data.rgOwnedApps ] ) ];
				}
				log.push( `Family Apps: ${response.rgFamilySharedApps.length}` );
			}
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
