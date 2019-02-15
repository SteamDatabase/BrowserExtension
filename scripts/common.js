/* global chrome:false, self:false, browser:false, GetCurrentAppID:true, GetHomepage:true, GetOption:true, GetLocalResource:true */
/* exported GetCurrentAppID, GetHomepage, GetOption, GetLocalResource, SendMessageToBackgroundScript, WriteLog */

'use strict';

var IsEdgeBrowser = GetLocalResource( 'manifest.json' ).indexOf( 'ms-browser-extension://' ) === 0;
var CurrentAppID;

function GetAppIDFromUrl( url )
{
	var appid = url.match( /\/(app|sub|bundle|friendsthatplay|gamecards|recommended)\/([0-9]{1,7})/ );
	
	return appid ? parseInt( appid[ 2 ], 10 ) : -1;
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

function GetOption( items, callback )
{
	if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		chrome.storage.local.get( items, callback );
	}
	else if( IsEdgeBrowser )
	{
		browser.storage.local.get( items, callback );
	}
	else if( typeof browser !== 'undefined' )
	{
		browser.storage.local.get( items ).then( callback );
	}
}

function GetLocalResource( res )
{
	if( typeof chrome !== 'undefined' && typeof chrome.extension !== 'undefined' )
	{
		return chrome.extension.getURL( res );
	}
	else if( typeof browser !== 'undefined' )
	{
		return browser.extension.getURL( res );
	}
	
	return res;
}

function SendMessageToBackgroundScript( message, callback )
{
	if( typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' )
	{
		return chrome.runtime.sendMessage( message, callback );
	}
	else if( typeof browser !== 'undefined' )
	{
		return browser.runtime.sendMessage( message, callback );
	}
}

function WriteLog( )
{
	// eslint-disable-next-line no-console
	console.log( '%c[SteamDB]%c', 'color:#2196F3; font-weight:bold;', '', ...arguments );
}
