( function()
{
	'use strict';
	
	var FoundState =
	{
		None: 0,
		Process: 1,
		Added: 2,
		DisableButtons: 3,
	};
	
	var i;
	var link;
	var giftCache = {};
	var hasLinksEnabled = document.body.dataset.steamdbLinks === 'true';
	var hasPreciseSubIDsEnabled = document.body.dataset.steamdbGiftSubid === 'true';
	var homepage = document.getElementById( 'steamdb_inventory_hook' ).dataset.homepage;
	var originalPopulateActions = window.PopulateActions;
	var hasQuickSellEnabled = document.body.dataset.steamdbQuickSell === 'true' && window.g_bViewingOwnProfile;
	var originalPopulateMarketActions = window.PopulateMarketActions;
	
	var dummySellEvent =
	{
		stop: function()
		{
			
		},
	};
	
	var quickSellButton = function( )
	{
		window.SellCurrentSelection();
		
		document.getElementById( 'market_sell_currency_input' ).value = this.dataset.price;
		document.getElementById( 'market_sell_dialog_accept_ssa' ).checked = true;
		
		window.SellItemDialog.OnInputKeyUp( null ); // Recalculate prices
		window.SellItemDialog.OnAccept( dummySellEvent );
		
		if( document.body.dataset.steamdbQuickSellAuto )
		{
			window.SellItemDialog.OnConfirmationAccept( dummySellEvent );
		}
	};
	
	if( document.body.dataset.steamdbNoSellReload )
	{
		var nextRefreshCausedBySell = false;
		var originalOnSuccess = window.SellItemDialog.OnSuccess;
		var originalReloadInventory = window.CUserYou.prototype.ReloadInventory;
		
		window.SellItemDialog.OnSuccess = function( transport )
		{
			nextRefreshCausedBySell = true;
			
			var className = 'listed';
			
			if( transport.responseJSON.requires_confirmation )
			{
				className = transport.responseJSON.needs_mobile_confirmation ? 'mobile' : 'email';
				
				transport.responseJSON.requires_confirmation = false;
			}
			
			window.g_ActiveInventory.selectedItem.element.classList.add( 'steamdb_confirm_' + className );
			
			originalOnSuccess.apply( this, arguments );
		};
		
		window.CUserYou.prototype.ReloadInventory = function( )
		{
			if( nextRefreshCausedBySell )
			{
				nextRefreshCausedBySell = false;
				
				window.g_ActiveInventory.selectedItem.element.classList.add( 'steamdb_sold' );
			}
			else
			{
				originalReloadInventory.apply( this, arguments );
			}
		};
	}
	
	window.PopulateMarketActions = function( elActions, item )
	{
		var realIsTrading = window.g_bIsTrading;
		var realIsMarketAllowed = window.g_bMarketAllowed;
		
		if( !window.g_bViewingOwnProfile )
		{
			window.g_bIsTrading = true; // Hides sell button
			window.g_bMarketAllowed = true; // Has to be set so Valve's code doesn't try to bind a tooltip on non existing sell button
		}
		
		originalPopulateMarketActions.apply( this, arguments );
		
		window.g_bIsTrading = realIsTrading;
		window.g_bMarketAllowed = realIsMarketAllowed;
		
		if( hasQuickSellEnabled && item.description.marketable && !item.description.is_currency && elActions.style.display !== 'none' )
		{
			var buttons = document.createElement( 'span' );
			buttons.style.float = 'right';
			
			var listNowText = document.createElement( 'span' );
			listNowText.textContent = 'List now (…)';
			
			var listNow = document.createElement( 'a' );
			listNow.title = 'Lists the item for lowest listed sell price\n\nDisplayed price is the money you receive (without fees)';
			listNow.href = 'javascript:void(0)';
			listNow.className = 'btn_small btn_blue_white_innerfade';
			listNow.style.opacity = 0.5;
			listNow.style.padding = '0 8px';
			listNow.style.overflow = 'hidden';
			listNow.style.textOverflow = 'ellipsis';
			listNow.style.whiteSpace = 'nowrap';
			listNow.style.maxWidth = '100px';
			listNow.appendChild( listNowText );
			
			var sellNowText = document.createElement( 'span' );
			sellNowText.textContent = 'Sell now (…)';
			
			var sellNow = document.createElement( 'a' );
			sellNow.title = 'Lists the item for highest listed buy order price\n\nDisplayed price is the money you receive (without fees)';
			sellNow.href = 'javascript:void(0)';
			sellNow.className = 'btn_small btn_blue_white_innerfade';
			sellNow.style.opacity = 0.5;
			sellNow.style.padding = '0 8px';
			sellNow.style.overflow = 'hidden';
			sellNow.style.textOverflow = 'ellipsis';
			sellNow.style.whiteSpace = 'nowrap';
			sellNow.style.maxWidth = '100px';
			sellNow.appendChild( sellNowText );
			
			buttons.appendChild( listNow );
			buttons.appendChild( document.createTextNode( ' ' ) );
			buttons.appendChild( sellNow );
				
			elActions.appendChild( buttons );
			
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function()
			{
				if( xhr.readyState === 4 && xhr.status === 200 )
				{
					var data = xhr.response;
					
					var commodityID = data.match( /Market_LoadOrderSpread\(\s?(\d+)\s?\);/ );
					
					if( !commodityID )
					{
						sellNowText.textContent = 'Sell now (error)';
						listNowText.textContent = 'List now (error)';
						
						return;
					}
					
					xhr = new XMLHttpRequest();
					xhr.onreadystatechange = function()
					{
						if( xhr.readyState === 4 && xhr.status === 200 )
						{
							data = xhr.response;
							
							if( !data.success )
							{
								sellNowText.textContent = 'Sell now (error)';
								listNowText.textContent = 'List now (error)';
								
								return;
							}
							
							var publisherFee = typeof item.description.market_fee !== 'undefined' ? item.description.market_fee : window.g_rgWalletInfo.wallet_publisher_fee_percent_default;
							var listNowFee = window.CalculateFeeAmount( data.lowest_sell_order, publisherFee );
							var listNowPrice = ( data.lowest_sell_order - listNowFee.fees ) / 100;
							var sellNowPrice = 0.0;
							
							listNow.style.removeProperty( 'opacity' );
							listNow.dataset.price = listNowPrice;
							listNow.addEventListener( 'click', quickSellButton );
							listNowText.textContent = 'List now (' + data.price_prefix + listNowPrice + data.price_suffix + ')';
							
							if( data.highest_buy_order )
							{
								var sellNowFee = window.CalculateFeeAmount( data.highest_buy_order, publisherFee );
								sellNowPrice = ( data.highest_buy_order - sellNowFee.fees ) / 100;
								
								sellNow.style.removeProperty( 'opacity' );
								sellNow.dataset.price = sellNowPrice;
								sellNow.addEventListener( 'click', quickSellButton );
								sellNowText.textContent = 'Sell now (' + data.price_prefix + sellNowPrice + data.price_suffix + ')';
							}
							else
							{
								sellNowText.style.display = 'none';
							}
						}
					};
					xhr.open( 'GET', 'https://steamcommunity.com/market/itemordershistogram?language=english' +
						'&country=' + window.g_rgWalletInfo.wallet_country +
						'&currency=' + window.g_rgWalletInfo.wallet_currency +
						'&item_nameid=' + commodityID[ 1 ], true );
					xhr.responseType = 'json';
					xhr.send();
				}
			};
			xhr.open( 'GET', 'https://steamcommunity.com/market/listings/' + item.description.appid + '/' + encodeURIComponent( window.GetMarketHashName( item.description ) ), true );
			xhr.send();
		}
	};
	
	window.PopulateActions = function( prefix, elActions, rgActions, item, owner )
	{
		var foundState = FoundState.None;
		
		try
		{
			// PopulateActions is called for both item.description.actions and item.description.owner_actions, we only want first one
			if( hasLinksEnabled && item.description.appid === 753 && rgActions === item.description.actions )
			{
				if( item.description.type === 'Coupon' && rgActions )
				{
					var couponLink, pos;
					
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							foundState = FoundState.Added;
							
							break;
						}
						else if( link.link )
						{
							pos = link.link.indexOf( 'list_of_subs=' );
							
							if( pos > 0 )
							{
								couponLink = link.link;
								
								foundState = FoundState.Process;
							}
						}
					}
					
					if( foundState === FoundState.Process )
					{
						var subs = couponLink.substring( pos + 'list_of_subs='.length ).split( ',' );
						
						for( i = 0; i < subs.length; i++ )
						{
							rgActions.push( {
								steamdb: true,
								link: homepage + 'sub/' + subs[ i ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension',
								name: 'View ' + subs[ i ] + ' on Steam Database',
							} );
						}
						
						foundState = FoundState.Added;
					}
				}
				else if( hasPreciseSubIDsEnabled && item.description.owner_actions && item.description.type === 'Gift' )
				{
					// If a gift has no actions, rgActions is undefined
					if( !rgActions )
					{
						rgActions = [];
					}
					
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							if( link.link.match( /^#steamdb_/ ) !== null )
							{
								rgActions[ i ].link = homepage + 'sub/' + giftCache[ item.description.classid ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
							}
							
							foundState = FoundState.Added;
							
							break;
						}
					}
					
					if( foundState !== FoundState.Added )
					{
						foundState = FoundState.DisableButtons;
						
						var action =
						{
							steamdb: true,
							link: '#steamdb_' + item.assetid,
							name: 'View on Steam Database',
						};
						
						if( giftCache[ item.description.classid ] )
						{
							action.link = homepage + 'sub/' + giftCache[ item.description.classid ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
						}
						else
						{
							var xhr = new XMLHttpRequest();
							xhr.onreadystatechange = function()
							{
								if( xhr.readyState === 4 && xhr.status === 200 && xhr.response.packageid )
								{
									giftCache[ item.description.classid ] = xhr.response.packageid;
									
									link = elActions.querySelector( '.item_actions a[href="#steamdb_' + item.assetid + '"]' );
									
									if( link )
									{
										link.classList.remove( 'btn_disabled' );
										link.href = homepage + 'sub/' + xhr.response.packageid + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
									}
								}
							};
							xhr.open( 'GET', 'https://steamcommunity.com/gifts/' + item.assetid + '/validateunpack', true );
							xhr.responseType = 'json';
							xhr.send();
						}
						
						rgActions.push( action );
					}
				}
				else if( rgActions )
				{
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							foundState = FoundState.Added;
							
							break;
						}
						else if( link.link && link.link.match( /\.com\/(app|sub)\// ) )
						{
							foundState = FoundState.Process;
						}
					}
					
					if( foundState === FoundState.Process )
					{
						for( i = 0; i < rgActions.length; i++ )
						{
							link = rgActions[ i ].link;
							
							if( !link )
							{
								continue;
							}
							
							link = link.match( /\.com\/(app|sub)\/([0-9]{1,6})/ );
							
							if( link )
							{
								rgActions.push( {
									steamdb: true,
									link: homepage + link[ 1 ] + '/' + link[ 2 ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension',
									name: 'View on Steam Database',
								} );
								
								foundState = FoundState.Added;
								
								break;
							}
						}
					}
				}
				else if( item.description.type === 'Gift' )
				{
					link = item.description.name.match( /^Unknown package ([0-9]+)$/ );
					
					if( link )
					{
						item.description.actions = rgActions = [ {
							steamdb: true,
							link: homepage + 'sub/' + link[ 1 ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension',
							name: 'View on Steam Database',
						} ];
					}
					else
					{
						item.description.actions = rgActions = [ {
							steamdb: true,
							link: homepage + 'search/?a=sub&q=' + encodeURIComponent( item.description.name ),
							name: 'Search on Steam Database',
						} ];
					}
					
					foundState = FoundState.Added;
				}
			}
		}
		catch( e )
		{
			// Don't break website functionality if something fails above
		}
		
		originalPopulateActions( prefix, elActions, rgActions, item, owner );
		
		// We want our links to be open in new tab
		if( foundState === FoundState.Added )
		{
			link = elActions.querySelectorAll( '.item_actions a[href^="' + homepage + '"]' );
			
			if( link )
			{
				for( i = 0; i < link.length; i++ )
				{
					link[ i ].target = '_blank';
				}
			}
		}
		else if( foundState === FoundState.DisableButtons )
		{
			link = elActions.querySelectorAll( '.item_actions a[href^="#steamdb_"]' );
			
			if( link )
			{
				for( i = 0; i < link.length; i++ )
				{
					link[ i ].target = '_blank';
					link[ i ].classList.add( 'btn_disabled' );
				}
			}
		}
	};
}() );
