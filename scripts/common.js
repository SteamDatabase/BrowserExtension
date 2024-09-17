/* exported _t, ExtensionApi, GetCurrentAppID, GetHomepage, GetOption, GetLocalResource, SendMessageToBackgroundScript, SetOption, WriteLog */

'use strict';

/** @type {browser} ExtensionApi */
// eslint-disable-next-line no-var
var ExtensionApi = ( () =>
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

// exported variable needs to be `var`
// eslint-disable-next-line no-var
var CurrentAppID;

function GetAppIDFromUrl( url )
{
	const appid = url.match( /\/(?:app|sub|bundle|friendsthatplay|gamecards|recommended|widget)\/(?<id>[0-9]+)/ );

	return appid ? Number.parseInt( appid.groups.id, 10 ) : -1;
}

function GetCurrentAppID()
{
	if( !CurrentAppID )
	{
		CurrentAppID = GetAppIDFromUrl( location.pathname );
	}

	return CurrentAppID;
}

function GetHomepage()
{
	return 'https://steamdb.info/';
}

function _t( message, substitutions = [] )
{
	return ExtensionApi.i18n.getMessage( message, substitutions );
}

function GetLanguage()
{
	return ExtensionApi.i18n.getUILanguage();
}

function GetOption( items, callback )
{
	ExtensionApi.storage.sync.get( items ).then( callback );
}

function SetOption( option, value )
{
	const obj = {};
	obj[ option ] = value;

	ExtensionApi.storage.sync.set( obj );
}

function GetLocalResource( res )
{
	return ExtensionApi.runtime.getURL( res );
}

function SendMessageToBackgroundScript( message, callback )
{
	const errorCallback = ( error ) => callback( { success: false, error: error.message } );

	try
	{
		ExtensionApi.runtime
			.sendMessage( message )
			.then( callback )
			.catch( errorCallback );
	}
	catch( error )
	{
		errorCallback( error );
	}
}

function WriteLog( )
{
	console.log( '%c[SteamDB]%c', 'color:#2196F3; font-weight:bold;', '', ...arguments );
}
