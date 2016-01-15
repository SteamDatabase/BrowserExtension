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
	
	var originalSetAssetOrCurrencyInTrade = window.CTradeOfferStateManager.SetAssetOrCurrencyInTrade;
	window.CTradeOfferStateManager.SetAssetOrCurrencyInTrade = function ( item, xferAmount, isCurrency )
	{
		// Make sure this item can actually be traded
		var appName = g_rgPartnerAppContextData[ item.appid ].name;
		var errorTitle = "Cannot Add \"" + item.name + "\" to Trade";
		
		switch ( g_rgPartnerAppContextData[ item.appid ].trade_permissions )
		{
			case 'NONE':
				ShowAlertDialog( errorTitle, g_strTradePartnerPersonaName + " cannot trade items in " + appName + "." );
				return;
			
			case 'SENDONLY':
			case 'SENDONLY_FULLINVENTORY':
				if ( !item.is_their_item )
				{
					ShowAlertDialog( errorTitle, g_strTradePartnerPersonaName + " cannot receive items in " + appName + (g_rgPartnerAppContextData[ item.appid ].trade_permissions == 'SENDONLY_FULLINVENTORY' ? " because their inventory is full" : "") + "." );
					return;
				}
				
				break;
			
			case 'RECEIVEONLY':
				if ( item.is_their_item )
				{
					ShowAlertDialog( errorTitle, g_strTradePartnerPersonaName + " cannot send items in " + appName + "." );
					return;
				}
				
				break;
		}
		
		originalSetAssetOrCurrencyInTrade.apply( this, arguments );
	};
};

var element = document.createElement( 'script' );
element.id = 'steamdb_fix_tradeoffers';
element.type = 'text/javascript';
element.appendChild (document.createTextNode ( '(' + FixTradeOffer.toString() + '())') );

document.head.appendChild( element );
