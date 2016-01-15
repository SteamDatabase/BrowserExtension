'use strict';

var item = window.location.search.match( /[\?&]for_item=([0-9]+)_([0-9]+)_([0-9]+)/ );

if( item !== null )
{
	var InjectScript = function( appid, contextid, assetid )
	{
		window.g_rgCurrentTradeStatus =
		{
			"newversion": true,
			"version": 1,
			"me": {
			    "assets": [],
			    "currency": [],
			    "ready": false
			},
			"them": {
			    "assets": [
			        {
			            "appid": appid,
			            "contextid": contextid.toString(),
			            "assetid": assetid.toString(),
			            "amount": 1
			        }
			    ],
			    "currency": [],
			    "ready": false
			}
		};
		
		window.RedrawCurrentTradeStatus();
	};
	
	var element = document.createElement( 'script' );
	element.id = 'steamdb_for_item';
	element.type = 'text/javascript';
	element.appendChild( document.createTextNode( '(' + InjectScript.toString() + '(' + item[ 1 ] + ',' + item[ 2 ] + ',' + item[ 3 ] + '))') );
	
	document.head.appendChild( element );
}

// Fix "offer changed"
var FixTradeOffer = function ()
{
	var originalToggleReady = window.ToggleReady;
	window.ToggleReady = function ( ready )
	{
		window.g_rgCurrentTradeStatus.me.ready = ready;
		originalToggleReady.apply( this, arguments );
	};
};

var element = document.createElement( 'script' );
element.id = 'steamdb_fix_tradeoffers';
element.type = 'text/javascript';
element.appendChild (document.createTextNode ( '(' + FixTradeOffer.toString() + '())') );

document.head.appendChild( element );
