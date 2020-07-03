let runtimeObj;

if( typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' )
{
	runtimeObj = chrome.runtime;
}
else
{
	runtimeObj = browser.runtime;
}

runtimeObj.onInstalled.addListener( ( event ) =>
{
	if( event.reason === 'install' && runtimeObj.openOptionsPage )
	{
		runtimeObj.openOptionsPage();
	}
} );

runtimeObj.onMessage.addListener( ( request, sender, callback ) =>
{
	switch( request.contentScriptQuery )
	{
		case 'InvalidateCache': InvalidateCache(); callback(); return true;
		case 'FetchSteamUserData': FetchSteamUserData( callback ); return true;
		case 'GetCurrentPlayers': GetCurrentPlayers( request.appid, callback ); return true;
		case 'GetPrice': GetPrice( request, callback ); return true;
	}

	return false;
} );

function InvalidateCache()
{
	SetOption( 'userdata.cached', Date.now() );
}

function FetchSteamUserData( callback )
{
	GetOption( { 'userdata.cached': Date.now() }, ( data ) =>
	{
		const now = Date.now();
		let cache = data[ 'userdata.cached' ];

		if( now > cache + 3600000 )
		{
			SetOption( 'userdata.cached', now );
			cache = now;
		}

		fetch( `https://store.steampowered.com/dynamicstore/userdata/?_=${encodeURIComponent( cache )}`,
			{
				cache: 'force-cache',
			} )
			.then( ( response ) => response.json() )
			.then( ( response ) =>
			{
				if( !response || !response.rgOwnedPackages || !response.rgOwnedPackages.length )
				{
					throw new Error( 'Are you logged on the Steam Store?' );
				}

				// Only keep the data we actually need
				const data =
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

				callback( { data: data } );

				SetOption( 'userdata.stored', JSON.stringify( data ) );
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
	fetch( `https://steamdb.info/api/GetCurrentPlayers/?appid=${encodeURIComponent( appid )}&source=extension_steam_store` )
		.then( ( response ) => response.json() )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

function GetPrice( request, callback )
{
	let url = `https://steamdb.info/api/ExtensionGetPrice/?appid=${encodeURIComponent( request.appid )}&currency=${encodeURIComponent( request.currency )}`;

	if( request.country )
	{
		url += `&country=${encodeURIComponent( request.country )}`;
	}

	fetch( url )
		.then( ( response ) => response.json() )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error.message } ) );
}

function GetOption( items, callback )
{
	if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		chrome.storage.local.get( items, callback );
	}
	else if( typeof browser !== 'undefined' )
	{
		browser.storage.local.get( items ).then( callback );
	}
}

function SetOption( option, value )
{
	const chromepls = {}; chromepls[ option ] = value;

	if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		chrome.storage.local.set( chromepls );
	}
	else if( typeof browser !== 'undefined' )
	{
		browser.storage.local.set( chromepls );
	}
}
