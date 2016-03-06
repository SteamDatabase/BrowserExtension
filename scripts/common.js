/* global chrome:false, self:false, GetCurrentAppID:true, GetHomepage:true, GetOption:true, GetLocalResource:true */

'use strict';

var CurrentAppID,
	GetAppIDFromUrl = function( url )
	{
		var appid = url.match( /\/(app|sub|bundle|friendsthatplay|gamecards|recommended)\/([0-9]{1,7})/ );
		
		return appid ? parseInt( appid[ 2 ], 10 ) : -1;
	},
	
	GetCurrentAppID = function()
	{
		if( !CurrentAppID )
		{
			CurrentAppID = GetAppIDFromUrl( location.pathname );
		}
		
		return CurrentAppID;
	},
	
	GetHomepage = function()
	{
		return 'https://steamdb.info/';
	},
	
	GetOption = function( items, callback )
	{
		if( typeof chrome !== 'undefined' )
		{
			chrome.storage.local.get( items, callback );
		} 
		else if( typeof self.options.firefox !== 'undefined' )
		{
			for( var item in items )
			{
				items[ item ] = self.options.preferences[ item ];
			}
			
			callback( items );
		}
	},
	
	GetLocalResource = function( res )
	{
		if( typeof chrome !== 'undefined' )
		{
			return chrome.extension.getURL( res );
		} 
		else if( typeof self.options.firefox !== 'undefined' )
		{
			return self.options[ res ];
		}
		
		return res;
	};
