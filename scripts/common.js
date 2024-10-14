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

/**
 * @param {String} url
 * @returns {Number}
 */
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

/**
 * @param {String} message
 * @param {String[]} substitutions
 * @returns {String}
 */
function _t( message, substitutions = [] )
{
	return ExtensionApi.i18n.getMessage( message, substitutions );
}

function GetLanguage()
{
	return ExtensionApi.i18n.getUILanguage();
}

/**
 * @callback GetOptionCallback
 * @param {{[key: string]: any}} items
 */

/**
 * @param {{[key: string]: any}} items
 * @param {GetOptionCallback} callback
 */
function GetOption( items, callback )
{
	ExtensionApi.storage.sync.get( items ).then( callback );
}

/**
 * @param {String} option
 */
function SetOption( option, value )
{
	const obj = {};
	obj[ option ] = value;

	ExtensionApi.storage.sync.set( obj );
}

/**
 * @param {String} res
 */
function GetLocalResource( res )
{
	return ExtensionApi.runtime.getURL( res );
}

/**
 * @callback SendMessageToBackgroundScriptCallback
 * @param {{success: Boolean, error?: String}?} data
 */

/**
 * @param {String} message
 * @param {SendMessageToBackgroundScriptCallback} callback
 */
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
