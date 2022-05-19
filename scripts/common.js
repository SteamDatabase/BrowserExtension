/* exported GetCurrentAppID, GetHomepage, GetOption, GetLocalResource, SendMessageToBackgroundScript, WriteLog */
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
	try
	{
		if( typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined' )
		{
			browser.runtime.sendMessage( message ).then( callback );
		}
		else if( typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' )
		{
			chrome.runtime.sendMessage( message, callback );
		}
		else
		{
			throw new Error( 'Did not find an API for sendMessage' );
		}
	}
	catch( error )
	{
		callback( { success: false, error: error.message } );
	}
}

function WriteLog( )
{
	// eslint-disable-next-line no-console
	console.log( '%c[SteamDB]%c', 'color:#2196F3; font-weight:bold;', '', ...arguments );
}
