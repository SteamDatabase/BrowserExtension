let runtimeObj;
let storeSessionId;
let checkoutSessionId;
let userDataCache = null;

if( typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined' )
{
	runtimeObj = browser.runtime;
}
else if( typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' )
{
	runtimeObj = chrome.runtime;
}
else
{
	throw new Error( 'Did not find an API for runtime' );
}

runtimeObj.onInstalled.addListener( ( event ) =>
{
	if( event.reason === runtimeObj.OnInstalledReason.INSTALL )
	{
		if( typeof browser !== 'undefined' && typeof browser.tabs !== 'undefined' )
		{
			browser.tabs.create( {
				url: browser.runtime.getURL( 'options/options.html' ) + '?welcome=1',
			} );
		}
		else if( typeof chrome !== 'undefined' && typeof chrome.tabs !== 'undefined' )
		{
			chrome.tabs.create( {
				url: chrome.runtime.getURL( 'options/options.html' ) + '?welcome=1',
			} );
		}
		else
		{
			throw new Error( 'Did not find an API for tabs.create' );
		}
	}
} );

runtimeObj.onMessage.addListener( ( request, sender, callback ) =>
{
	if( !sender || !sender.tab )
	{
		return false;
	}

	if( !Object.hasOwnProperty.call( request, 'contentScriptQuery' ) )
	{
		return false;
	}

	switch( request.contentScriptQuery )
	{
		case 'InvalidateCache': InvalidateCache(); callback(); return true;
		case 'FetchSteamUserData': FetchSteamUserData( callback ); return true;
		case 'GetCurrentPlayers': GetCurrentPlayers( request.appid, callback ); return true;
		case 'GetPrice': GetPrice( request, callback ); return true;
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

	return false;
} );

function InvalidateCache()
{
	userDataCache = null;

	SetOption( 'userdata.cached', Date.now() );
}

function FetchSteamUserData( callback )
{
	if( userDataCache !== null )
	{
		callback( { data: userDataCache } );
		return;
	}

	GetOption( { 'userdata.cached': Date.now() }, ( data ) =>
	{
		const now = Date.now();
		let cache = data[ 'userdata.cached' ];

		if( now > cache + 3600000 )
		{
			SetOption( 'userdata.cached', now );
			cache = now;
		}

		const params = new URLSearchParams();
		params.set( '_', cache );

		fetch( `https://store.steampowered.com/dynamicstore/userdata/?${params.toString()}`,
			{
				credentials: 'include',
				headers: {
					// Pretend we're doing a normal navigation request.
					// This will trigger login.steampowered.com redirect flow if user has expired cookies.
					Accept: 'text/html',
				},
			} )
			.then( ( response ) => response.json() )
			.then( ( response ) =>
			{
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

					rgIgnoredApps: response.rgIgnoredApps || {},
					rgIgnoredPackages: response.rgIgnoredPackages || {},

					rgFollowedApps: response.rgFollowedApps || [],
					rgWishlist: response.rgWishlist || [],
				};

				callback( { data: userDataCache } );

				SetOption( 'userdata.stored', JSON.stringify( userDataCache ) );
			} )
			.catch( ( error ) =>
			{
				InvalidateCache();

				GetOption( { 'userdata.stored': false }, function( data )
				{
					const response =
					{
						error: error.message,
					};

					if( data[ 'userdata.stored' ] )
					{
						response.data = JSON.parse( data[ 'userdata.stored' ] );
					}

					callback( response );
				} );
			} );
	} );
}

function GetCurrentPlayers( appid, callback )
{
	const params = new URLSearchParams();
	params.set( 'appid', parseInt( appid, 10 ) );

	fetch( `https://steamdb.info/api/GetCurrentPlayers/?${params.toString()}`, {
		credentials: 'omit',
		headers: {
			Accept: 'application/json',
			'X-Requested-With': 'SteamDB',
		},
	} )
		.then( ( response ) => response.json() )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

function GetPrice( { appid, currency }, callback )
{
	const params = new URLSearchParams();
	params.set( 'appid', parseInt( appid, 10 ) );
	params.set( 'currency', currency );

	fetch( `https://steamdb.info/api/ExtensionGetPrice/?${params.toString()}`, {
		credentials: 'omit',
		headers: {
			Accept: 'application/json',
			'X-Requested-With': 'SteamDB',
		},
	} )
		.then( ( response ) => response.json() )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

function StoreWishlistAdd( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', parseInt( appid, 10 ) );
	ExecuteStoreApiCall( 'api/addtowishlist', formData, callback );
}

function StoreWishlistRemove( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', parseInt( appid, 10 ) );
	ExecuteStoreApiCall( 'api/removefromwishlist', formData, callback );
}

function StoreFollow( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', parseInt( appid, 10 ) );
	ExecuteStoreApiCall( 'explore/followgame/', formData, callback );
}

function StoreUnfollow( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', parseInt( appid, 10 ) );
	formData.set( 'unfollow', 1 );
	ExecuteStoreApiCall( 'explore/followgame/', formData, callback );
}

function StoreIgnore( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', parseInt( appid, 10 ) );
	formData.set( 'ignore_reason', 0 );
	ExecuteStoreApiCall( 'recommended/ignorerecommendation/', formData, callback );
}

function StoreUnignore( appid, callback )
{
	const formData = new FormData();
	formData.set( 'appid', parseInt( appid, 10 ) );
	formData.set( 'remove', 1 );
	ExecuteStoreApiCall( 'recommended/ignorerecommendation/', formData, callback );
}

function StoreAddToCart( request, callback )
{
	const formData = new FormData();
	formData.set( 'action', 'add_to_cart' );

	if( request.subid )
	{
		formData.set( 'subid', parseInt( request.subid, 10 ) );
	}
	else if( request.bundleid )
	{
		formData.set( 'bundleid', parseInt( request.bundleid, 10 ) );
	}
	else
	{
		return;
	}

	ExecuteStoreApiCall( 'cart/addtocart', formData, callback );
}

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
			case 53: message = 'You got rate limited, try again in an hour.'; break;
			default: message = resultCode === null
				? 'There was a problem adding this product to your account.'
				: `There was a problem adding this product to your account. PurchaseResultDetail=${resultCode}`;
		}

		callback( {
			success: false,
			error: message,
		} );
	};

	if( request.subid )
	{
		const subid = parseInt( request.subid, 10 );
		const formData = new FormData();
		formData.set( 'ajax', 'true' );

		ExecuteStoreApiCall( `freelicense/addfreelicense/${subid}`, formData, freeLicenseResponse, true );
	}
	else if( request.bundleid )
	{
		const bundleid = parseInt( request.bundleid, 10 );
		const formData = new FormData();
		formData.set( 'ajax', 'true' );

		ExecuteStoreApiCall( `freelicense/addfreebundle/${bundleid}`, formData, freeLicenseResponse, true );
	}
}

function StoreRemoveFreeLicense( request, callback )
{
	if( request.subid )
	{
		const subid = parseInt( request.subid, 10 );
		const formData = new FormData();
		formData.set( 'packageid', subid );
		ExecuteStoreApiCall( 'account/removelicense', formData, callback );
	}
}

function StoreRequestPlaytestAccess( request, callback )
{
	const playtestResponse = ( response ) =>
	{
		if( response && response.success )
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
		ExecuteStoreApiCall( `ajaxrequestplaytestaccess/${parseInt( request.appid, 10 )}`, formData, playtestResponse, true );
	}
}

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

					if( text.includes( 'steam_parental_password_box' ) )
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

				if( response && response.success )
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

			if( session && session[ 1 ] )
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
						? 'Failed to failed sessionid. It does not look like you are logged in to the Steam store.'
						: 'Failed to failed sessionid. Something went horribly wrong, you should report this issue.',
				} );
			}
		} )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

function GetOption( items, callback )
{
	if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
	{
		browser.storage.local.get( items ).then( callback );
	}
	else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		chrome.storage.local.get( items, callback );
	}
	else
	{
		throw new Error( 'Did not find an API for storage.local.get' );
	}
}

function SetOption( option, value )
{
	const chromepls = {}; chromepls[ option ] = value;

	if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
	{
		browser.storage.local.set( chromepls );
	}
	else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		chrome.storage.local.set( chromepls );
	}
	else
	{
		throw new Error( 'Did not find an API for storage.local.set' );
	}
}
