/* exported _t, GetCurrentAppID, GetHomepage, GetOption, GetLocalResource, SendMessageToBackgroundScript, WriteLog */
/* eslint-disable no-unused-vars */

'use strict';

// exported variable needs to be `var`
// eslint-disable-next-line no-var
var CurrentAppID;

function GetAppIDFromUrl( url )
{
	const appid = url.match( /\/(?:app|sub|bundle|friendsthatplay|gamecards|recommended|widget)\/(?<id>[0-9]+)/ );

	return appid ? parseInt( appid.groups.id, 10 ) : -1;
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
	return'https://steamdb.info/';
}

function _t( message, substitutions = [] )
{
	if( typeof browser !== 'undefined' && typeof browser.i18n !== 'undefined' )
	{
		return browser.i18n.getMessage( message, substitutions );
	}
	else if( typeof chrome !== 'undefined' && typeof chrome.i18n !== 'undefined' )
	{
		return chrome.i18n.getMessage( message, substitutions );
	}
	else
	{
		throw new Error( 'Did not find an API for i18n' );
	}
}

function GetOption( items, callback )
{
	if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
	{
		browser.storage.sync.get( items ).then( callback );
	}
	else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		chrome.storage.sync.get( items ).then( callback );
	}
	else
	{
		throw new Error( 'Did not find an API for storage' );
	}
}

function GetLocalResource( res )
{
	if( typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined' )
	{
		return browser.runtime.getURL( res );
	}
	else if( typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' )
	{
		return chrome.runtime.getURL( res );
	}

	throw new Error( 'Did not find an API for getURL' );
}

function SendMessageToBackgroundScript( message, callback )
{
	const errorCallback = ( error ) => callback( { success: false, error: error.message } );

	try
	{
		if( typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined' )
		{
			browser.runtime.sendMessage( message ).then( callback ).catch( errorCallback );
		}
		else if( typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' )
		{
			chrome.runtime.sendMessage( message ).then( callback ).catch( errorCallback );
		}
		else
		{
			throw new Error( 'Did not find an API for sendMessage' );
		}
	}
	catch( error )
	{
		errorCallback( error );
	}
}

function WriteLog( )
{
	// eslint-disable-next-line no-console
	console.log( '%c[SteamDB]%c', 'color:#2196F3; font-weight:bold;', '', ...arguments );
}
