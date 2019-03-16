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
		case 'FetchSteamUserData': FetchSteamUserData( callback ); return true;
		case 'GetCurrentPlayers': GetCurrentPlayers( request.appid, callback ); return true;
		case 'GetPrice': GetPrice( request, callback ); return true;
	}

	return false;
} );

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

		fetch(
			`https://store.steampowered.com/dynamicstore/userdata/?_=${encodeURIComponent( cache )}`,
			{
				cache: 'force-cache'
			}
		)
			.then( ( response ) => response.json() )
			.then( ( response ) =>
			{
				if( !response || !response.rgOwnedPackages || !response.rgOwnedPackages.length )
				{
					throw new Error( 'Empty user data' );
				}

				// null out some data we don't care about
				response.preferences = null;
				response.rgAutoGrantApps = null;
				response.rgCreatorsFollowed = null;
				response.rgCreatorsIgnored = null;
				response.rgCurations = null;
				response.rgCurators = null;
				response.rgRecommendedTags = null;

				callback( { data: response } );

				SetOption( 'userdata.stored', JSON.stringify( response ) );
			} )
			.catch( ( error ) =>
			{
				SetOption( 'userdata.cached', Date.now() );

				chrome.storage.local.get( 'userdata.stored', function( data )
				{
					callback( {
						error: error,
						data: data[ 'userdata.stored' ] ? JSON.parse( data[ 'userdata.stored' ] ) : {}
					} );
				} );
			} );
	} );
}

function GetCurrentPlayers( appid, callback )
{
	fetch( `https://steamdb.info/api/GetCurrentPlayers/?appid=${encodeURIComponent( appid )}&source=extension_steam_store` )
		.then( ( response ) => response.json() )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error } ) );
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
		.catch( ( error ) => callback( { success: false, error: error } ) );
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
	var chromepls = {}; chromepls[ option ] = value;

	if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		chrome.storage.local.set( chromepls );
	}
	else if( typeof browser !== 'undefined' )
	{
		browser.storage.local.set( chromepls );
	}
}
