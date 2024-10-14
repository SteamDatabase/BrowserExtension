'use strict';

let storeSessionId;
let checkoutSessionId;
let userDataCache = null;
let userFamilyDataCache = null;
let userFamilySemaphore = null;
let nextAllowedRequest = 0;

/** @type {browser} ExtensionApi */
const ExtensionApi = ( () =>
{
	if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
	{
		return browser;
	}
	else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		return chrome;
	}

	throw new Error( 'Did not find appropriate web extensions api' );
} )();

ExtensionApi.runtime.onInstalled.addListener( ( event ) =>
{
	if( event.reason === ExtensionApi.runtime.OnInstalledReason.INSTALL )
	{
		ExtensionApi.tabs.create( {
			url: ExtensionApi.runtime.getURL( 'options/options.html' ) + '?welcome=1',
		} );
	}
} );

ExtensionApi.runtime.onMessage.addListener( ( request, sender, callback ) =>
{
	if( !sender || !sender.tab )
	{
		return false;
	}

	if( !Object.hasOwn( request, 'contentScriptQuery' ) )
	{
		return false;
	}

	switch( request.contentScriptQuery )
	{
		case 'InvalidateCache': InvalidateCache(); callback(); return true;
		case 'FetchSteamUserData': FetchSteamUserData( callback ); return true;
		case 'FetchSteamUserFamilyData': FetchSteamUserFamilyData( callback ); return true;
		case 'GetApp': GetApp( request.appid, callback ); return true;
		case 'GetAppPrice': GetAppPrice( request, callback ); return true;
		case 'GetAchievementsGroups': GetAchievementsGroups( request.appid, callback ); return true;
		case 'StoreWishlistAdd': StoreWishlistAdd( request.appid, callback ); return true;
		case 'StoreWishlistRemove': StoreWishlistRemove( request.appid, callback ); return true;
		case 'StoreFollow': StoreFollow( request.appid, callback ); return true;
		case 'StoreUnfollow': StoreUnfollow( request.appid, callback ); return true;
		case 'StoreIgnore': StoreIgnore( request.appid, callback ); return true;
		case 'StoreUnignore': StoreUnignore( request.appid, callback ); return true;
		case 'StoreAddToCart': StoreAddToCart( request, callback ); return true;
		case 'StoreAddFreeLicense': StoreAddFreeLicense( request, callback ); return true;
		case 'StoreRemoveFreeLicense': StoreRemoveFreeLicense( request, callback ); return true;
		case 'StoreRequestPlaytestAccess': StoreRequestPlaytestAccess( request, callback ); return true;
	}

	callback( { success: false, error: 'Unknown query' } );
	return false;
} );

function InvalidateCache()
{
	userDataCache = null;
	userFamilyDataCache = null;

	SetLocalOption( 'userdata.cached', Date.now() );
	SetLocalOption( 'userfamilydata', '{}' );
}

/**
 * @param {Function} callback
 */
async function FetchSteamUserData( callback )
{
	if( userDataCache !== null )
	{
		callback( { data: userDataCache } );
		return;
	}

	const now = Date.now();
	const cacheData = await GetLocalOption( { 'userdata.cached': now } );
	let cacheTime = cacheData[ 'userdata.cached' ];

	if( now > cacheTime + 3600000 )
	{
		await SetLocalOption( 'userdata.cached', now );
		cacheTime = now;
	}

	const params = new URLSearchParams();
	params.set( '_', cacheTime );

	try
	{
		const responseFetch = await fetch(
			`https://store.steampowered.com/dynamicstore/userdata/?${params.toString()}`,
			{
				credentials: 'include',
				headers: {
				// Pretend we're doing a normal navigation request.
				// This will trigger login.steampowered.com redirect flow if user has expired cookies.
					Accept: 'text/html',
				},
			}
		);
		const response = await responseFetch.json();

		if( !response || !response.rgOwnedPackages || !response.rgOwnedPackages.length )
		{
			throw new Error( 'Are you logged on the Steam Store in this browser?' );
		}

		// Only keep the data we actually need
		userDataCache =
		{
			rgOwnedPackages: response.rgOwnedPackages || [],
			rgOwnedApps: response.rgOwnedApps || [],

			rgPackagesInCart: response.rgPackagesInCart || [],
			rgAppsInCart: response.rgAppsInCart || [],

			rgIgnoredApps: response.rgIgnoredApps || {}, // object, not array
			rgIgnoredPackages: response.rgIgnoredPackages || {},

			rgFollowedApps: response.rgFollowedApps || [],
			rgWishlist: response.rgWishlist || [],
		};

		callback( { data: userDataCache } );

		await SetLocalOption( 'userdata.stored', JSON.stringify( userDataCache ) );
	}
	catch( error )
	{
		InvalidateCache();

		const data = await GetLocalOption( { 'userdata.stored': false } );
		const response =
		{
			error: error.message,
		};

		if( data[ 'userdata.stored' ] )
		{
			response.data = JSON.parse( data[ 'userdata.stored' ] );
		}

		callback( response );
	}
}

/**
 * @param {Function} callback
 */
async function FetchSteamUserFamilyData( callback )
{
	if( userFamilyDataCache !== null )
	{
		callback( { data: userFamilyDataCache } );
		return;
	}

	if( userFamilySemaphore !== null )
	{
		callback( await userFamilySemaphore );
		return;
	}

	const now = Date.now();
	const cacheData = await GetLocalOption( { userfamilydata: false } );
	const cache = cacheData.userfamilydata && JSON.parse( cacheData.userfamilydata );

	if( cache && cache.cached && cache.data && now < cache.cached + 21600000 )
	{
		callback( { data: cache.data } );
		return;
	}

	let callbackResponse = null;
	let semaphoreResolve = null;
	userFamilySemaphore = new Promise( resolve =>
	{
		semaphoreResolve = resolve;
	} );

	try
	{
		const tokenResponseFetch = await fetch(
			`https://store.steampowered.com/pointssummary/ajaxgetasyncconfig`,
			{
				credentials: 'include',
				headers: {
					Accept: 'application/json',
				},
			}
		);
		const token = await tokenResponseFetch.json();

		if( !token || !token.success || !token.data || !token.data.webapi_token )
		{
			throw new Error( 'Are you logged on the Steam Store in this browser?' );
		}

		const paramsSharedLibrary = new URLSearchParams();
		paramsSharedLibrary.set( 'access_token', token.data.webapi_token );
		paramsSharedLibrary.set( 'family_groupid', '0' ); // family_groupid is ignored
		paramsSharedLibrary.set( 'include_excluded', 'true' );
		paramsSharedLibrary.set( 'include_free', 'true' );
		paramsSharedLibrary.set( 'include_non_games', 'true' );

		// the include_own param has no link with its name, if it is false, then it returns only your owned apps.
		// if true, it returns your owned apps and the apps from your family.
		paramsSharedLibrary.set( 'include_own', 'true' );

		const responseFetch = await fetch(
			`https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?${paramsSharedLibrary.toString()}`,
			{
				headers: {
					Accept: 'application/json',
				}
			}
		);
		const response = await responseFetch.json();

		if( !response || !response.response || !response.response.apps )
		{
			throw new Error( 'Is Steam okay?' );
		}

		const reduced = response.response.apps.reduce( ( data, app ) =>
		{
			if( !app.owner_steamids.includes( response.response.owner_steamid ) )
			{
				if( app.exclude_reason === 0 )
				{
					data.shared.push( app.appid );
				}
			}
			else
			{
				data.owned.push( app.appid );
			}

			return data;
		}, {
			shared: [],
			owned: []
		} );

		userFamilyDataCache =
		{
			rgFamilySharedApps: reduced.shared,
			rgOwnedApps: reduced.owned,
		};

		callbackResponse =
		{
			data: userFamilyDataCache
		};

		callback( callbackResponse );

		await SetLocalOption( 'userfamilydata', JSON.stringify( {
			data: userFamilyDataCache,
			cached: now
		} ) );
	}
	catch( error )
	{
		callbackResponse =
		{
			error: error.message,
		};

		if( cache && cache.data )
		{
			callbackResponse.data = cache.data;
		}

		callback( callbackResponse );
	}
	finally
	{
		semaphoreResolve( callbackResponse );
		userFamilySemaphore = null;
	}
}

/**
 * @param {Response} response
 */
function GetJsonWithStatusCheck( response )
{
	if( !response.ok )
	{
		if( response.status === 429 )
		{
			let retryAfter = Number.parseInt( response.headers.get( 'Retry-After' ), 10 );

			if( Number.isNaN( retryAfter ) || retryAfter < 1 )
			{
				retryAfter = 60;
			}

			nextAllowedRequest = Date.now() + ( retryAfter * 1000 ) + ( Math.random() * 10000 );

			console.log( 'Rate limited for', retryAfter, 'seconds, retry after', new Date( nextAllowedRequest ) );
		}

		const e = new Error( `HTTP ${response.status}` );
		e.name = 'ServerError';
		throw e;
	}

	return response.json();
}

/**
 * @param {Function} callback
 */
function GetApp( appid, callback )
{
	if( nextAllowedRequest > 0 && Date.now() < nextAllowedRequest )
	{
		callback( { success: false, error: 'Rate limited' } );
		return;
	}

	const params = new URLSearchParams();
	params.set( 'appid', Number.parseInt( appid, 10 ) );

	fetch( `https://steamdb.info/api/ExtensionApp/?${params.toString()}`, {
		headers: {
			Accept: 'application/json',
			'X-Requested-With': 'SteamDB',
		},
	} )
		.then( GetJsonWithStatusCheck )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

/**
 * @param {Function} callback
 */
function GetAppPrice( { appid, currency }, callback )
{
	if( nextAllowedRequest > 0 && Date.now() < nextAllowedRequest )
	{
		callback( { success: false, error: 'Rate limited' } );
		return;
	}

	const params = new URLSearchParams();
	params.set( 'appid', Number.parseInt( appid, 10 ) );
	params.set( 'currency', currency );

	fetch( `https://steamdb.info/api/ExtensionAppPrice/?${params.toString()}`, {
		headers: {
			Accept: 'application/json',
			'X-Requested-With': 'SteamDB',
		},
	} )
		.then( GetJsonWithStatusCheck )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

/**
 * @param {Function} callback
 */
function GetAchievementsGroups( appid, callback )
{
	if( nextAllowedRequest > 0 && Date.now() < nextAllowedRequest )
	{
		callback( { success: false, error: 'Rate limited' } );
		return;
	}

	const params = new URLSearchParams();
	params.set( 'appid', Number.parseInt( appid, 10 ) );

	fetch( `https://steamdb.info/api/ExtensionGetAchievements/?${params.toString()}`, {
		headers: {
			Accept: 'application/json',
			'X-Requested-With': 'SteamDB',
		},
	} )
		.then( GetJsonWithStatusCheck )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

/**
 * @param {Function} callback
 */
function StoreWishlistAdd( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', Number.parseInt( appid, 10 ) );
	ExecuteStoreApiCall( 'api/addtowishlist', formData, callback );
}

/**
 * @param {Function} callback
 */
function StoreWishlistRemove( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', Number.parseInt( appid, 10 ) );
	ExecuteStoreApiCall( 'api/removefromwishlist', formData, callback );
}

/**
 * @param {Function} callback
 */
function StoreFollow( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', Number.parseInt( appid, 10 ) );
	ExecuteStoreApiCall( 'explore/followgame/', formData, callback );
}

/**
 * @param {Function} callback
 */
function StoreUnfollow( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', Number.parseInt( appid, 10 ) );
	formData.set( 'unfollow', 1 );
	ExecuteStoreApiCall( 'explore/followgame/', formData, callback );
}

/**
 * @param {Function} callback
 */
function StoreIgnore( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', Number.parseInt( appid, 10 ) );
	formData.set( 'ignore_reason', 0 );
	ExecuteStoreApiCall( 'recommended/ignorerecommendation/', formData, callback );
}

/**
 * @param {Function} callback
 */
function StoreUnignore( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', Number.parseInt( appid, 10 ) );
	formData.set( 'remove', 1 );
	ExecuteStoreApiCall( 'recommended/ignorerecommendation/', formData, callback );
}

/**
 * @param {Function} callback
 */
function StoreAddToCart( request, callback )
{
	const formData = new FormData();
	formData.set( 'action', 'add_to_cart' );

	if( request.subid )
	{
		formData.set( 'subid', Number.parseInt( request.subid, 10 ) );
	}
	else if( request.bundleid )
	{
		formData.set( 'bundleid', Number.parseInt( request.bundleid, 10 ) );
	}
	else
	{
		return;
	}

	ExecuteStoreApiCall( 'cart/addtocart', formData, callback );
}

/**
 * @param {Function} callback
 */
function StoreAddFreeLicense( request, callback )
{
	const freeLicenseResponse = ( response ) =>
	{
		if( Array.isArray( response ) )
		{
			// This api returns [] on success
			callback( { success: true } );

			InvalidateCache();

			return;
		}

		const resultCode = response?.purchaseresultdetail ?? null;
		let message;

		switch( resultCode )
		{
			case 5: message = 'Steam says this is an invalid package.'; break;
			case 9: message = 'This product is already available in your Steam library.'; break;
			case 24: message = 'You do not own the required app.'; break;
			case 53: message = 'You got rate limited, try again later.'; break;
			default: message = resultCode === null
				? `There was a problem adding this product to your account. ${response?.error ?? ''}`
				: `There was a problem adding this product to your account. PurchaseResultDetail=${resultCode}`;
		}

		callback( {
			success: false,
			error: message,
			resultCode,
		} );
	};

	if( request.subid )
	{
		const subid = Number.parseInt( request.subid, 10 );
		const formData = new FormData();
		formData.set( 'ajax', 'true' );

		ExecuteStoreApiCall( `freelicense/addfreelicense/${subid}`, formData, freeLicenseResponse, true );
	}
	else if( request.bundleid )
	{
		const bundleid = Number.parseInt( request.bundleid, 10 );
		const formData = new FormData();
		formData.set( 'ajax', 'true' );

		ExecuteStoreApiCall( `freelicense/addfreebundle/${bundleid}`, formData, freeLicenseResponse, true );
	}
}

/**
 * @param {Function} callback
 */
function StoreRemoveFreeLicense( request, callback )
{
	if( request.subid )
	{
		const subid = Number.parseInt( request.subid, 10 );
		const formData = new FormData();
		formData.set( 'packageid', subid );
		ExecuteStoreApiCall( 'account/removelicense', formData, callback );
	}
}

/**
 * @param {Function} callback
 */
function StoreRequestPlaytestAccess( request, callback )
{
	const playtestResponse = ( response ) =>
	{
		if( response?.success )
		{
			const granted = !!response.granted;

			callback( { success: true, granted } );

			if( granted )
			{
				InvalidateCache();
			}
		}
		else
		{
			callback( { success: false, granted: false } );
		}
	};

	if( request.appid )
	{
		const formData = new FormData();
		ExecuteStoreApiCall( `ajaxrequestplaytestaccess/${Number.parseInt( request.appid, 10 )}`, formData, playtestResponse, true );
	}
}

/**
 * @param {Function} callback
 */
function ExecuteStoreApiCall( path, formData, callback, rawCallback = false )
{
	const isCheckout = path.startsWith( 'checkout/' );

	GetStoreSessionID( isCheckout, ( session ) =>
	{
		if( !session.success )
		{
			callback( session );
			return;
		}

		formData.set( 'sessionid', session.sessionID );

		let url;

		if( isCheckout )
		{
			url = `https://checkout.steampowered.com/${path}`;
		}
		else
		{
			url = `https://store.steampowered.com/${path}`;
		}

		fetch( url, {
			credentials: 'include',
			method: 'POST',
			body: formData,
			headers: {
				// Specify that we're doing an AJAX request, which will prevent Steam from
				// nuking users' cookies (even though it won't do that for POST requests either way)
				'X-Requested-With': 'SteamDB',
			},
		} )
			.then( async( response ) =>
			{
				// If we get 401 Unauthorized, it's likely that the login cookie has expired,
				// if that's the case, requesting page to get sessionid again should go through
				// login redirect and set a fresh login cookie.
				// Or the sessionid simply changed.
				// Except for ajaxrequestplaytestaccess which actually can return 401 as part of the api
				if( response.status === 401 && !path.startsWith( 'ajaxrequestplaytestaccess/' ) )
				{
					storeSessionId = null;
					checkoutSessionId = null;
				}

				// Handle possible family view requirement
				if( response.status === 403 )
				{
					const text = await response.clone().text();

					if( text.includes( 'data-featuretarget="parentalunlock"' ) || text.includes( 'data-featuretarget="parentalfeaturerequest"' ) )
					{
						throw new Error( 'Your account is currently under Family View restrictions. You need to exit Family View by entering your PIN on the Steam store and then retry this action.' );
					}
				}

				return response.json();
			} )
			.then( ( response ) =>
			{
				if( rawCallback )
				{
					callback( response );
					return;
				}

				if( path === 'explore/followgame/' )
				{
					// This API returns just true/false instead of an object
					response = {
						success: response === true,
					};
				}

				if( response?.success )
				{
					callback( { success: true } );

					InvalidateCache();
				}
				else
				{
					callback( { success: false, error: 'Failed to do the action. Are you logged in on the Steam store?\nThis item may not be available in your country.' } );
				}
			} )
			.catch( ( error ) => callback( { success: false, error: error.message } ) );
	} );
}

/**
 * @param {Boolean} isCheckout
 * @param {Function} callback
 */
function GetStoreSessionID( isCheckout, callback )
{
	let url;

	if( isCheckout )
	{
		if( checkoutSessionId )
		{
			callback( { success: true, sessionID: checkoutSessionId } );
			return;
		}

		url = 'https://checkout.steampowered.com/checkout/addfreelicense';
	}
	else
	{
		if( storeSessionId )
		{
			callback( { success: true, sessionID: storeSessionId } );
			return;
		}

		url = 'https://store.steampowered.com/account/preferences';
	}

	fetch( url, {
		credentials: 'include',
		headers: {
			// We have to specify that we're doing a normal request (as if the user was navigating).
			// This will trigger login.steampowered.com redirect flow if user has expired cookies.
			Accept: 'text/html',
		},
	} )
		.then( ( response ) => response.text() )
		.then( ( response ) =>
		{
			const session = response.match( /g_sessionID = "(\w+)";/ );

			if( session?.[ 1 ] )
			{
				if( isCheckout )
				{
					checkoutSessionId = session[ 1 ];
				}
				else
				{
					storeSessionId = session[ 1 ];
				}

				callback( { success: true, sessionID: session[ 1 ] } );
			}
			else
			{
				callback( {
					success: false,
					error: response.includes( 'login' )
						? 'Failed to fetch sessionid. It does not look like you are logged in to the Steam store.'
						: 'Failed to fetch sessionid. Something went horribly wrong, you should report this issue.',
				} );
			}
		} )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

/**
 * @param {{[key: string]: any}} items
 * @return Promise<{[key: string]: any}>
 */
function GetLocalOption( items )
{
	return ExtensionApi.storage.local.get( items );
}

/**
 * @param {String} option
 */
function SetLocalOption( option, value )
{
	const obj = {};
	obj[ option ] = value;

	return ExtensionApi.storage.local.set( obj );
}
