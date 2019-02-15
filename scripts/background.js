let runtimeObj;

if( typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' )
{
	runtimeObj = chrome.runtime;
}
else
{
	runtimeObj = browser.runtime;
}

runtimeObj.onMessage.addListener( ( request, sender, callback ) =>
{
	switch( request.contentScriptQuery )
	{
		case 'FetchSteamUserData': FetchSteamUserData( request.cacheBust, callback ); return true;
		case 'GetCurrentPlayers': GetCurrentPlayers( request.appid, callback ); return true;
		case 'GetPrice': GetPrice( request, callback ); return true;
	}

	return false;
} );

function FetchSteamUserData( cacheBust, callback )
{
	fetch( `https://store.steampowered.com/dynamicstore/userdata/?_=${encodeURIComponent( cacheBust )}` )
		.then( ( response ) => response.json() )
		.then( callback )
		.catch( ( error ) => callback( { success: false, error: error } ) );
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
