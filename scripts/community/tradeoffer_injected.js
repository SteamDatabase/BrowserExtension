( function()
{
	'use strict';

	if( !window.CTradeOfferStateManager )
	{
		return;
	}

	const originalToggleReady = window.ToggleReady;
	window.ToggleReady = function( ready )
	{
		window.g_rgCurrentTradeStatus.me.ready = ready;

		if( document.body.dataset.steamdbNoGiftConfirm === 'true' )
		{
			window.g_cTheirItemsInTrade = 1;
			window.g_bWarnOnReady = false;
		}

		originalToggleReady.apply( this, arguments );
	};

	const originalShowAlertDialog = window.ShowAlertDialog;
	const originalSetAssetOrCurrencyInTrade = window.CTradeOfferStateManager.SetAssetOrCurrencyInTrade;
	window.CTradeOfferStateManager.SetAssetOrCurrencyInTrade = function SteamDB_SetAssetOrCurrencyInTrade( item )
	{
		try
		{
			// Make sure this item can actually be traded
			const appName = window.g_rgPartnerAppContextData[ item.appid ].name;
			const errorTitle = 'Cannot Add "' + item.name + '" to Trade';

			switch( window.g_rgPartnerAppContextData[ item.appid ].trade_permissions )
			{
				case 'NONE':
					originalShowAlertDialog( errorTitle, window.g_strTradePartnerPersonaName + ' cannot trade items in ' + appName + '.' );
					return;

				case 'SENDONLY':
				case 'SENDONLY_FULLINVENTORY':
					if( !item.is_their_item )
					{
						originalShowAlertDialog( errorTitle, window.g_strTradePartnerPersonaName + ' cannot receive items in ' + appName + ( window.g_rgPartnerAppContextData[ item.appid ].trade_permissions === 'SENDONLY_FULLINVENTORY' ? ' because their inventory is full' : '' ) + '.' );
						return;
					}

					break;

				case 'RECEIVEONLY':
					if( item.is_their_item )
					{
						originalShowAlertDialog( errorTitle, window.g_strTradePartnerPersonaName + ' cannot send items in ' + appName + '.' );
						return;
					}

					break;
			}
		}
		catch( ex )
		{
			// don't care!
		}

		originalSetAssetOrCurrencyInTrade.apply( this, arguments );
	};

	window.ShowAlertDialog = function SteamDB_ShowAlertDialog( strTitle, strDescription )
	{
		const eresult = strDescription.match( /\(([0-9]+)\)$/ );
		if( eresult !== null )
		{
			let explanation;

			switch( +eresult[ 1 ] )
			{
				case 2: explanation = 'There was an internal error when sending your trade offer.'; break;
				case 11: explanation = 'This trade offer is not currently active. It may have been previously accepted or canceled.'; break;
				case 16: explanation = 'The Steam Community servers did not get a timely reply from the economy server. Your offer may or may not have been sent.<br><br>Please check your sent trade offers.'; break;
				case 20: explanation = 'The trade offer server is temporarily unavailable.'; break;
				case 25: explanation = 'You cannot send this trade offer because you have exceeded your active offer limit.<br><br>You are limited to 5 outstanding trade offers to a single user, and 30 outstanding trade offers in total.'; break;
				case 26: explanation = 'One or more of the items in this trade offer is no longer present in the inventory from which it is being requested.<br><br>Please check all items to ensure that they still exist and are tradable.'; break;
			}

			if( explanation )
			{
				strTitle += ' Failed';
				strDescription += '<p class="steamdb_trade_error">' + explanation + '</p>';
				strDescription += '<a href="https://steamdb.info/extension/" target="_blank" class="steamdb_trade_error_explained">(explained by SteamDB)</a>';
			}
		}

		return originalShowAlertDialog.apply( this, arguments );
	};
}() );
