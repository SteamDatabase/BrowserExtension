'use strict';

var FixTradeOffer = function ()
{
	var originalToggleReady = window.ToggleReady;
	window.ToggleReady = function ( ready )
	{
		window.g_rgCurrentTradeStatus.me.ready = ready;
		
		if ( document.body.dataset.steamdbNoGiftConfirm === 'true' )
		{
			window.g_cTheirItemsInTrade = 1;
			window.g_bWarnOnReady = false;
		}
		
		originalToggleReady.apply( this, arguments );
	};
	
	var originalSetAssetOrCurrencyInTrade = window.CTradeOfferStateManager.SetAssetOrCurrencyInTrade;
	window.CTradeOfferStateManager.SetAssetOrCurrencyInTrade = function ( item, xferAmount, isCurrency )
	{
		// Make sure this item can actually be traded
		var appName = g_rgPartnerAppContextData[ item.appid ].name;
		var errorTitle = "Cannot Add \"" + item.name + "\" to Trade";
		
		try
		{
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
		}
		catch (ex)
		{
			// don't care!
		}
		
		originalSetAssetOrCurrencyInTrade.apply( this, arguments );
	};
};

GetOption( {"enhancement-tradeoffer-no-gift-confirm": null}, function ( items )
{
	if ( items['enhancement-tradeoffer-no-gift-confirm'] )
	{
		document.body.dataset.steamdbNoGiftConfirm = 'true';
	}
	
	var element = document.createElement( 'script' );
	element.id = 'steamdb_fix_tradeoffers';
	element.type = 'text/javascript';
	element.appendChild (document.createTextNode ( '(' + FixTradeOffer.toString() + '())') );

	document.head.appendChild( element );
});
