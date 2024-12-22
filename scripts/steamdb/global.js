/**
 * @typedef {import('../common')}
 */

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

GetOption( { 'steamdb-highlight': true, 'steamdb-highlight-family': true }, async( items ) =>
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}

	/** @type {Promise<{data?: object, error?: string}>} */
	const userDataPromise = new Promise( ( resolve ) =>
	{
		SendMessageToBackgroundScript( {
			contentScriptQuery: 'FetchSteamUserData',
		}, resolve );
	} );

	/** @type {Promise<{data?: object, error?: string}>} */
	const familyDataPromise = new Promise( ( resolve ) =>
	{
		if( !items[ 'steamdb-highlight-family' ] )
		{
			resolve( {} );
			return;
		}

		SendMessageToBackgroundScript( {
			contentScriptQuery: 'FetchSteamUserFamilyData',
		}, resolve );
	} );

	/** @type {Promise<{error?: string}>} */
	const familyDataTimeoutPromise = new Promise( ( resolve ) =>
	{
		setTimeout( () =>
		{
			resolve( { error: 'Family data timed out' } );
		}, 10000 ); // 10 seconds
	} );

	const userData = await userDataPromise;

	// If family data does not load fast enough, assume it failed
	const familyData = await Promise.race( [
		familyDataPromise,
		familyDataTimeoutPromise,
	] );

	if( userData.error )
	{
		WriteLog( 'Failed to load userdata', userData.error );

		window.postMessage( {
			version: EXTENSION_INTEROP_VERSION,
			type: 'steamdb:extension-error',
			error: `Failed to load your games. ${userData.error}`,
		}, GetHomepage() );
	}

	if( familyData.error )
	{
		WriteLog( 'Failed to load family userdata', familyData.error );
	}

	let response = null;
	let beforeDom = false;

	if( userData.data )
	{
		response = userData.data;

		if( familyData.data )
		{
			response.rgFamilySharedApps = familyData.data.rgFamilySharedApps;

			if( familyData.data.rgOwnedApps )
			{
				// Merge owned apps from the shared library because it returns extra apps
				// that are not returned by the dynamicstore such as tools
				response.rgOwnedApps = Array.from( new Set( [
					...response.rgOwnedApps,
					...familyData.data.rgOwnedApps
				] ) );
			}
		}
	}

	const OnPageLoaded = () =>
	{
		if( response )
		{
			window.postMessage( {
				version: EXTENSION_INTEROP_VERSION,
				type: 'steamdb:extension-loaded',
				data: response,
			}, GetHomepage() );

			WriteLog(
				'Userdata loaded',
				beforeDom ? '(before dom completed)' : '',
				'Packages',
				response.rgOwnedPackages?.length || 0,
				'Family Apps',
				response.rgFamilySharedApps?.length || 0,
			);
		}
	};

	if( document.readyState === 'loading' )
	{
		beforeDom = true;

		document.addEventListener( 'DOMContentLoaded', OnPageLoaded, { once: true } );
	}
	else
	{
		OnPageLoaded();
	}
} );
