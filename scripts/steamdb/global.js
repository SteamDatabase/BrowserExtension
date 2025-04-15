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
	document.addEventListener( 'readystatechange', OnPageLoadedInit, { once: true } );
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

	/** @type {Promise<{data?: Record<string, any>, error?: string}>} */
	const userDataPromise = new Promise( ( resolve ) =>
	{
		SendMessageToBackgroundScript( {
			contentScriptQuery: 'FetchSteamUserData',
		}, resolve );
	} );

	/** @type {Promise<{data?: Record<string, any>, error?: string}>} */
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

	/** @type {Promise<{data?: undefined, error?: string}>} */
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

	/** @type {Record<string, any>} */
	let response = null;

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
				'Packages',
				response.rgOwnedPackages?.length || 0,
				'Family Apps',
				response.rgFamilySharedApps?.length || 0,
			);
		}
	};

	const IsSiteReady = () => document.readyState === 'complete' || !!document.getElementById( 'main' );

	if( IsSiteReady() )
	{
		OnPageLoaded();
		return;
	}

	// As we wait for promises to complete first, chances are very high that the main element should be ready by now,
	// but to avoid any possible issues we still have a fallback to the mutation observer.
	//
	// The website has code to process the extension messages loaded in a script before the #main element,
	// and this script is not deferred. But to apply the highlights to all the elements correctly,
	// the site will have to wait for the DOM to complete loading before applying the highlights.
	//
	// We avoid waiting for DOMContentLoaded event and instead wait for the receiving script to be ready,
	// because postMessage() itself may take time.

	WriteLog( 'Data loaded too fast, site is not yet ready.' );

	const observer = new MutationObserver( () =>
	{
		if( IsSiteReady() )
		{
			observer.disconnect();
			OnPageLoaded();
		}
	} );

	observer.observe( document.documentElement, {
		childList: true,
		subtree: true
	} );
} );
