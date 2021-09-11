( function()
{
	'use strict';

	const FoundState =
	{
		None: 0,
		Process: 1,
		Added: 2,
		DisableButtons: 3,
	};

	let i;
	let link;
	const giftCache = {};
	const hasLinksEnabled = document.body.dataset.steamdbLinks === 'true';
	const hasPreciseSubIDsEnabled = document.body.dataset.steamdbGiftSubid === 'true';
	const homepage = document.getElementById( 'steamdb_inventory_hook' ).dataset.homepage;
	const originalPopulateActions = window.PopulateActions;
	const hasQuickSellEnabled = document.body.dataset.steamdbQuickSell === 'true' && window.g_bViewingOwnProfile;
	const originalPopulateMarketActions = window.PopulateMarketActions;

	const dummySellEvent =
	{
		stop: function()
		{

		},
	};

	const quickSellButton = function( )
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
		let nextRefreshCausedBySell = false;
		const originalOnSuccess = window.SellItemDialog.OnSuccess;
		const originalReloadInventory = window.CUserYou.prototype.ReloadInventory;

		window.SellItemDialog.OnSuccess = function( transport )
		{
			nextRefreshCausedBySell = true;

			let className = 'listed';

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
		const realIsTrading = window.g_bIsTrading;
		const realIsMarketAllowed = window.g_bMarketAllowed;

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
			const buttons = document.createElement( 'span' );
			buttons.className = 'steamdb_quick_sell';

			const listNowText = document.createElement( 'span' );
			listNowText.textContent = 'List at …';

			const listNow = document.createElement( 'a' );
			listNow.title = 'Lists the item for lowest listed sell price\n\nDisplayed price is the money you receive (without fees)';
			listNow.href = 'javascript:void(0)';
			listNow.className = 'btn_small btn_blue_white_innerfade';
			listNow.style.opacity = 0.5;
			listNow.appendChild( listNowText );

			const sellNowText = document.createElement( 'span' );
			sellNowText.textContent = 'Sell at …';

			const sellNow = document.createElement( 'a' );
			sellNow.title = 'Lists the item for highest listed buy order price\n\nDisplayed price is the money you receive (without fees)';
			sellNow.href = 'javascript:void(0)';
			sellNow.className = 'btn_small btn_blue_white_innerfade';
			sellNow.style.opacity = 0.5;
			sellNow.appendChild( sellNowText );

			buttons.appendChild( listNow );
			buttons.appendChild( document.createTextNode( ' ' ) );
			buttons.appendChild( sellNow );

			elActions.appendChild( buttons );

			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function()
			{
				if( xhr.readyState === 4 && xhr.status === 200 )
				{
					let data = xhr.response;

					const commodityID = data.match( /Market_LoadOrderSpread\(\s?(\d+)\s?\);/ );

					if( !commodityID )
					{
						sellNow.style.display = 'none';
						listNow.style.display = 'none';

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
								sellNow.style.display = 'none';
								sellNow.style.display = 'none';

								return;
							}

							const publisherFee = typeof item.description.market_fee !== 'undefined' ? item.description.market_fee : window.g_rgWalletInfo.wallet_publisher_fee_percent_default;

							if( data.lowest_sell_order )
							{
								const listNowFee = window.CalculateFeeAmount( data.lowest_sell_order, publisherFee );
								const listNowPrice = ( data.lowest_sell_order - listNowFee.fees ) / 100;

								listNow.style.removeProperty( 'opacity' );
								listNow.style.removeProperty( 'display' );
								listNow.dataset.price = listNowPrice;
								listNow.addEventListener( 'click', quickSellButton );
								listNowText.textContent = 'List at ' + data.price_prefix + listNowPrice + data.price_suffix;
							}
							else
							{
								listNow.style.display = 'none';
							}

							if( data.highest_buy_order )
							{
								const sellNowFee = window.CalculateFeeAmount( data.highest_buy_order, publisherFee );
								const sellNowPrice = ( data.highest_buy_order - sellNowFee.fees ) / 100;

								sellNow.style.removeProperty( 'opacity' );
								sellNow.style.removeProperty( 'display' );
								sellNow.dataset.price = sellNowPrice;
								sellNow.addEventListener( 'click', quickSellButton );
								sellNowText.textContent = 'Sell at ' + data.price_prefix + sellNowPrice + data.price_suffix;
							}
							else
							{
								sellNow.style.display = 'none';
							}
						}
					};
					xhr.open( 'GET', '/market/itemordershistogram?language=english' +
						'&country=' + window.g_rgWalletInfo.wallet_country +
						'&currency=' + window.g_rgWalletInfo.wallet_currency +
						'&item_nameid=' + commodityID[ 1 ], true );
					xhr.responseType = 'json';
					xhr.send();
				}
			};
			xhr.open( 'GET', '/market/listings/' + item.description.appid + '/' + encodeURIComponent( window.GetMarketHashName( item.description ) ), true );
			xhr.send();
		}
	};

	window.PopulateActions = function( prefix, elActions, rgActions, item, owner )
	{
		let foundState = FoundState.None;

		try
		{
			// PopulateActions is called for both item.description.actions and item.description.owner_actions, we only want first one
			if( hasLinksEnabled && item.description.appid === 753 && rgActions === item.description.actions )
			{
				if( item.description.type === 'Coupon' && rgActions )
				{
					let couponLink, pos;

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
						const subs = couponLink.substring( pos + 'list_of_subs='.length ).split( ',' );

						for( i = 0; i < subs.length; i++ )
						{
							rgActions.push( {
								steamdb: true,
								link: homepage + 'sub/' + subs[ i ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension',
								name: 'View ' + subs[ i ] + ' on SteamDB',
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

						const action =
						{
							steamdb: true,
							link: '#steamdb_' + item.assetid,
							name: 'View on SteamDB',
						};

						if( giftCache[ item.description.classid ] )
						{
							action.link = homepage + 'sub/' + giftCache[ item.description.classid ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
						}
						else
						{
							const xhr = new XMLHttpRequest();
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
							xhr.open( 'GET', '/gifts/' + item.assetid + '/validateunpack', true );
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

							link = link.match( /\.com\/(app|sub)\/([0-9]+)/ );

							if( link )
							{
								rgActions.push( {
									steamdb: true,
									link: homepage + link[ 1 ] + '/' + link[ 2 ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension',
									name: 'View on SteamDB',
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
							name: 'View on SteamDB',
						} ];
					}
					else
					{
						item.description.actions = rgActions = [ {
							steamdb: true,
							link: homepage + 'search/?a=sub&q=' + encodeURIComponent( item.description.name ),
							name: 'Search on SteamDB',
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
