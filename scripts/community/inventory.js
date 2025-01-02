'use strict';

( ( () =>
{
	const FoundState =
	{
		None: 0,
		Process: 1,
		Added: 2,
		DisableButtons: 3,
	};

	const giftCache = {}; // TODO: Store this in indexeddb

	const scriptHook = document.getElementById( 'steamdb_inventory_hook' );
	const homepage = scriptHook.dataset.homepage;
	const i18n = JSON.parse( scriptHook.dataset.i18n );
	const options = JSON.parse( scriptHook.dataset.options );

	const hasLinksEnabled = options[ 'link-inventory' ];
	const hasPreciseSubIDsEnabled = options[ 'link-inventory-gift-subid' ];
	const hasBadgeInfoEnabled = options[ 'enhancement-inventory-badge-info' ];
	let hasQuickSellEnabled = options[ 'enhancement-inventory-quick-sell' ] && window.g_bViewingOwnProfile && window.g_bMarketAllowed;

	const dummySellEvent =
	{
		stop: () =>
		{
			// empty
		},
	};

	const OnQuickSellButtonClick = function( )
	{
		window.SellCurrentSelection();

		document.getElementById( 'market_sell_currency_input' ).value = this.dataset.price / 100;

		window.SellItemDialog.OnInputKeyUp( null ); // Recalculate prices

		if( options[ 'enhancement-inventory-quick-sell-auto' ] )
		{
			// SSA must be accepted before OnAccept call, as it has a check for it
			document.getElementById( 'market_sell_dialog_accept_ssa' ).checked = true;

			window.SellItemDialog.OnAccept( dummySellEvent );
			window.SellItemDialog.OnConfirmationAccept( dummySellEvent );
		}
	};

	const currencyCode = window.GetCurrencyCode( window.g_rgWalletInfo.wallet_currency );
	const FormatCurrency = ( valueInCents ) =>
		window.v_currencyformat( valueInCents, currencyCode, window.g_rgWalletInfo.wallet_country );

	if( options[ 'enhancement-inventory-no-sell-reload' ] )
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

	const originalBuildHover = window.BuildHover;

	window.BuildHover = function( prefix )
	{
		document.querySelector( `#${prefix} .steamdb_quick_sell` )?.remove();
		document.querySelector( `#${prefix} .steamdb_badge_info` )?.remove();

		originalBuildHover.apply( this, arguments );
	};

	const originalPopulateMarketActions = window.PopulateMarketActions;

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
			listNowText.textContent = i18n.inventory_list_at.replace( '%price%', FormatCurrency( 0 ) );

			const listNow = document.createElement( 'a' );
			listNow.title = i18n.inventory_list_at_title;
			listNow.href = 'javascript:void(0)'; // eslint-disable-line no-script-url
			listNow.className = 'btn_small btn_darkblue_white_innerfade';
			listNow.style.opacity = 0.5;
			listNow.appendChild( listNowText );

			const sellNowText = document.createElement( 'span' );
			sellNowText.textContent = i18n.inventory_sell_at.replace( '%price%', FormatCurrency( 0 ) );

			const sellNow = document.createElement( 'a' );
			sellNow.title = i18n.inventory_sell_at_title;
			sellNow.href = 'javascript:void(0)'; // eslint-disable-line no-script-url
			sellNow.className = 'btn_small btn_darkblue_white_innerfade';
			sellNow.style.opacity = 0.5;
			sellNow.appendChild( sellNowText );

			buttons.appendChild( listNow );
			buttons.appendChild( document.createTextNode( ' ' ) );
			buttons.appendChild( sellNow );

			elActions.insertAdjacentElement( 'afterend', buttons );

			GetMarketItemNameId( item, ( commodityID ) =>
			{
				if( !commodityID )
				{
					buttons.remove();

					return;
				}

				const histogramParams = new URLSearchParams();
				histogramParams.set( 'country', window.g_rgWalletInfo.wallet_country );
				histogramParams.set( 'language', 'english' );
				histogramParams.set( 'currency', window.g_rgWalletInfo.wallet_currency );
				histogramParams.set( 'item_nameid', commodityID );
				histogramParams.set( 'two_factor', '0' );

				const xhrHistogram = new XMLHttpRequest();
				xhrHistogram.onreadystatechange = () =>
				{
					if( xhrHistogram.readyState !== 4 )
					{
						return;
					}

					if( xhrHistogram.status !== 200 )
					{
						if( xhrHistogram.status === 429 )
						{
							// If user is currently rate limited by Steam market, just disable the buttons
							hasQuickSellEnabled = false;
						}

						buttons.remove();

						return;
					}

					const data = xhrHistogram.response;

					if( !data.success )
					{
						buttons.remove();

						return;
					}

					const publisherFee = typeof item.description.market_fee !== 'undefined' ? item.description.market_fee : window.g_rgWalletInfo.wallet_publisher_fee_percent_default;

					if( data.lowest_sell_order )
					{
						const listNowFee = window.CalculateFeeAmount( data.lowest_sell_order, publisherFee );
						const listNowPrice = data.lowest_sell_order - listNowFee.fees;

						listNow.style.removeProperty( 'opacity' );
						listNow.dataset.price = listNowPrice;
						listNow.addEventListener( 'click', OnQuickSellButtonClick );
						listNowText.textContent = i18n.inventory_list_at.replace( '%price%', FormatCurrency( listNowPrice ) );
					}
					else
					{
						listNow.remove();
					}

					if( data.highest_buy_order )
					{
						const sellNowFee = window.CalculateFeeAmount( data.highest_buy_order, publisherFee );
						const sellNowPrice = data.highest_buy_order - sellNowFee.fees;

						sellNow.style.removeProperty( 'opacity' );
						sellNow.dataset.price = sellNowPrice;
						sellNow.addEventListener( 'click', OnQuickSellButtonClick );
						sellNowText.textContent = i18n.inventory_sell_at.replace( '%price%', FormatCurrency( sellNowPrice ) );
					}
					else
					{
						sellNow.remove();
					}
				};
				xhrHistogram.open( 'GET', '/market/itemordershistogram?' + histogramParams.toString(), true );
				xhrHistogram.setRequestHeader( 'X-Requested-With', 'SteamDB' );
				xhrHistogram.responseType = 'json';
				xhrHistogram.send();
			} );
		}
	};

	let badgesDataLoaded = false;
	let badgesData = [];

	function AddBadgeInformation( element, rgActions, item, steamid )
	{
		if( !item.description.market_fee_app )
		{
			return;
		}

		let isTradingCard = false;
		let isFoilCard = false;
		let foundBadge = false;

		for( const tag of item.description.tags )
		{
			if( tag.category === 'cardborder' )
			{
				isFoilCard = tag.internal_name !== 'cardborder_0';
			}
			else if( tag.category === 'item_class' )
			{
				isTradingCard = tag.internal_name === 'item_class_2';
			}
		}

		const CreateLink = ( foil ) =>
			`https://steamcommunity.com/profiles/${steamid}/gamecards/${item.description.market_fee_app}${foil ? '?border=1' : ''}`;

		for( const badge of badgesData )
		{
			if( badge.appid !== item.description.market_fee_app )
			{
				continue;
			}

			const isFoilBadge = badge.border_color > 0;

			if( isTradingCard && isFoilCard !== isFoilBadge )
			{
				continue;
			}

			foundBadge = true;

			const span = document.createElement( 'span' );
			const str = isFoilBadge ? i18n.inventory_badge_foil_level : i18n.inventory_badge_level;
			span.textContent = str.replace( '%level%', badge.level.toString() );

			const link = document.createElement( 'a' );
			link.className = 'btnv6_blue_hoverfade btn_small_thin';
			link.href = CreateLink( isFoilBadge );
			link.append( span );

			element.append( link );
		}

		if( !foundBadge )
		{
			const span = document.createElement( 'span' );
			span.textContent = i18n.inventory_badge_none;

			const link = document.createElement( 'a' );
			link.className = 'btnv6_blue_hoverfade btn_small_thin';
			link.href = CreateLink( isFoilCard );
			link.append( span );

			element.append( link );
		}

		// TODO: This has a race condition when it's called after badge info fetch() as it directly modifies rgActions
		for( let i = 0; i < rgActions.length; i++ )
		{
			if( rgActions[ i ].link.startsWith( 'https://steamcommunity.com/my/gamecards/' ) )
			{
				// Remove the 'View badge progress' button
				rgActions.splice( i, 1 );
				break;
			}
		}
	}

	function LoadBadgeInformation( element, rgActions, item, steamid )
	{
		if( badgesDataLoaded )
		{
			if( badgesData.length > 0 )
			{
				AddBadgeInformation( element, rgActions, item, steamid );
			}

			return;
		}

		// TODO: This has a race condition if user switches to another item before the fetch request completes
		// but the only problem they will get is no badge info will be displayed.
		badgesDataLoaded = true;

		const applicationConfigElement = document.getElementById( 'application_config' );

		if( !applicationConfigElement )
		{
			return;
		}

		const applicationConfig = JSON.parse( applicationConfigElement.dataset.config );
		const accessToken = JSON.parse( applicationConfigElement.dataset.loyalty_webapi_token );

		if( !accessToken )
		{
			return;
		}

		const params = new URLSearchParams();
		params.set( 'origin', location.origin );
		params.set( 'format', 'json' );
		params.set( 'access_token', accessToken );
		params.set( 'steamid', steamid );
		params.set( 'x_requested_with', 'SteamDB' );

		fetch( `${applicationConfig.WEBAPI_BASE_URL}IPlayerService/GetBadges/v1/?${params.toString()}` )
			.then( ( response ) => response.json() )
			.then( ( response ) =>
			{
				if( response.response?.badges )
				{
					badgesData = response.response.badges;

					AddBadgeInformation( element, rgActions, item, steamid );
				}
			} );
	}

	const originalPopulateActions = window.PopulateActions;

	window.PopulateActions = function( prefix, elActions, rgActions, item, owner )
	{
		let foundState = FoundState.None;

		try
		{
			if( hasBadgeInfoEnabled && window.g_bViewingOwnProfile && item.description.appid === 753 && item.description.tags && elActions.classList.contains( 'item_owner_actions' ) )
			{
				let itemClass = null;

				for( const tag of item.description.tags )
				{
					if( tag.category === 'item_class' )
					{
						itemClass = tag.internal_name;
						break;
					}
				}

				if(
					itemClass === 'item_class_2' || // trading card
					itemClass === 'item_class_5' // booster pack
				)
				{
					const element = document.createElement( 'div' );
					element.className = 'steamdb_badge_info';
					elActions.insertAdjacentElement( 'beforebegin', element );

					LoadBadgeInformation( element, rgActions, item, owner.strSteamId );
				}
			}

			// PopulateActions is called for both item.description.actions and item.description.owner_actions, we only want first one
			if( hasLinksEnabled && item.description.appid === 753 && rgActions === item.description.actions )
			{
				if( item.description.type === 'Coupon' && rgActions )
				{
					let couponLink;
					let pos;

					for( let i = 0; i < rgActions.length; i++ )
					{
						const link = rgActions[ i ];

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

						for( let i = 0; i < subs.length; i++ )
						{
							rgActions.push( {
								steamdb: true,
								link: homepage + 'sub/' + subs[ i ] + '/',
								name: i18n.view_on_steamdb, // TODO: Add subid?
							} );
						}

						foundState = FoundState.Added;
					}
				}
				else if( hasPreciseSubIDsEnabled && item.description.owner_actions && ( item.description.type === 'Gift' || item.description.type === 'Guest Pass' ) )
				{
					// If a gift has no actions, rgActions is undefined
					if( !rgActions )
					{
						arguments[ 2 ] = item.description.actions = rgActions = [];
					}

					for( let i = 0; i < rgActions.length; i++ )
					{
						const link = rgActions[ i ];

						if( link.steamdb )
						{
							foundState = FoundState.Added;

							if( link.link.startsWith( '#steamdb_' ) )
							{
								if( giftCache[ item.description.classid ] )
								{
									rgActions[ i ].link = homepage + 'sub/' + giftCache[ item.description.classid ] + '/';
								}
								else
								{
									foundState = FoundState.DisableButtons;
								}
							}

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
							name: i18n.view_on_steamdb,
						};

						if( giftCache[ item.description.classid ] )
						{
							action.link = homepage + 'sub/' + giftCache[ item.description.classid ] + '/';
						}
						else
						{
							const xhr = new XMLHttpRequest();
							xhr.onreadystatechange = () =>
							{
								if( xhr.readyState === 4 && xhr.status === 200 && xhr.response.packageid )
								{
									giftCache[ item.description.classid ] = xhr.response.packageid;

									const link = elActions.querySelector( '.item_actions a[href="#steamdb_' + item.assetid + '"]' );

									if( link )
									{
										link.classList.remove( 'btn_disabled' );
										link.href = homepage + 'sub/' + xhr.response.packageid + '/';
										// TODO: Add subid to the button text?
									}
								}
							};
							xhr.open( 'GET', '/gifts/' + item.assetid + '/validateunpack', true );
							xhr.setRequestHeader( 'X-Requested-With', 'SteamDB' );
							xhr.responseType = 'json';
							xhr.send();
						}

						rgActions.push( action );
					}
				}
				else if( rgActions )
				{
					for( let i = 0; i < rgActions.length; i++ )
					{
						const link = rgActions[ i ];

						if( link.steamdb )
						{
							foundState = FoundState.Added;

							break;
						}
						else if( link.link?.match( /\.com\/(app|sub)\// ) )
						{
							foundState = FoundState.Process;
						}
					}

					if( foundState === FoundState.Process )
					{
						for( let i = 0; i < rgActions.length; i++ )
						{
							const link = rgActions[ i ].link;

							if( !link )
							{
								continue;
							}

							const linkMatch = link.match( /\.com\/(app|sub)\/([0-9]+)/ );

							if( linkMatch )
							{
								rgActions.push( {
									steamdb: true,
									link: homepage + linkMatch[ 1 ] + '/' + linkMatch[ 2 ] + '/',
									name: i18n.view_on_steamdb, // TODO: Add id?
								} );

								foundState = FoundState.Added;

								break;
							}
						}
					}
				}
				else if( item.description.type === 'Gift' )
				{
					const linkMatch = item.description.name.match( /^Unknown package ([0-9]+)$/ );

					if( linkMatch )
					{
						item.description.actions = rgActions = [ {
							steamdb: true,
							link: homepage + 'sub/' + linkMatch[ 1 ] + '/',
							name: i18n.view_on_steamdb,
						} ];
					}
					else
					{
						item.description.actions = rgActions = [ {
							steamdb: true,
							link: homepage + 'search/?a=sub&q=' + encodeURIComponent( item.description.name ),
							name: i18n.view_on_steamdb,
						} ];
					}

					foundState = FoundState.Added;
				}
			}
		}
		catch( e )
		{
			// Don't break website functionality if something fails above
			console.error( '[SteamDB]', e );
		}

		originalPopulateActions.apply( this, arguments );

		// We want our links to be open in new tab
		if( foundState === FoundState.Added )
		{
			const link = elActions.querySelectorAll( '.item_actions a[href^="' + homepage + '"]' );

			if( link )
			{
				for( let i = 0; i < link.length; i++ )
				{
					link[ i ].target = '_blank';
				}
			}
		}
		else if( foundState === FoundState.DisableButtons )
		{
			const link = elActions.querySelectorAll( '.item_actions a[href^="#steamdb_"]' );

			if( link )
			{
				for( let i = 0; i < link.length; i++ )
				{
					link[ i ].target = '_blank';
					link[ i ].classList.add( 'btn_disabled' );
				}
			}
		}
	};

	function GetMarketItemNameId( item, callback )
	{
		const appid = item.description.appid;
		const marketHashName = encodeURIComponent( window.GetMarketHashName( item.description ) );
		const cacheKey = `${appid}_${marketHashName}`;

		GetCachedItemId( cacheKey )
			.then( ( value ) =>
			{
				if( value )
				{
					callback( value );
					return;
				}

				const xhr = new XMLHttpRequest();
				xhr.onreadystatechange = () =>
				{
					if( xhr.readyState !== 4 )
					{
						return;
					}

					if( xhr.status !== 200 )
					{
						if( xhr.status === 429 )
						{
							// If user is currently rate limited by Steam market, just disable the buttons
							hasQuickSellEnabled = false;
						}

						callback( null );
						return;
					}

					const data = xhr.response;

					const commodityID = data.match( /Market_LoadOrderSpread\(\s?(?<id>\d+)\s?\);/ );

					if( !commodityID )
					{
						callback( null );
						return;
					}

					SetCachedItemId( cacheKey, commodityID.groups.id )
						.then( () =>
						{
							callback( commodityID.groups.id );
						} )
						.catch( ( err ) =>
						{
							console.error( '[SteamDB] DB set fail', err );

							callback( commodityID.groups.id );
						} );
				};
				xhr.open( 'GET', `/market/listings/${appid}/${marketHashName}`, true );
				xhr.setRequestHeader( 'X-Requested-With', 'SteamDB' );
				xhr.send();
			} )
			.catch( ( err ) =>
			{
				console.error( '[SteamDB] DB get fail', err );

				callback( null );
			} );
	}

	/**
	 * IndexedDB. Ref: https://github.com/jakearchibald/idb-keyval
	 */
	const itemDatabase = CreateItemStore( 'steamdb_extension', 'itemid_name_cache' );

	function PromisifyDbRequest( request )
	{
		return new Promise( ( resolve, reject ) =>
		{
			request.oncomplete = request.onsuccess = () => resolve( request.result );
			request.onabort = request.onerror = () => reject( request.error );
		} );
	}

	function CreateItemStore( dbName, storeName )
	{
		const request = indexedDB.open( dbName );
		request.onupgradeneeded = () => request.result.createObjectStore( storeName );
		const dbp = PromisifyDbRequest( request );
		return ( txMode, callback ) => dbp.then( ( db ) => callback( db.transaction( storeName, txMode ).objectStore( storeName ) ) );
	}

	/**
	 * Get a value by its key.
	 */
	function GetCachedItemId( key )
	{
		return itemDatabase( 'readonly', ( store ) => PromisifyDbRequest( store.get( key ) ) );
	}

	/**
	 * Set a value with a key.
	 */
	function SetCachedItemId( key, value )
	{
		return itemDatabase( 'readwrite', ( store ) =>
		{
			store.put( value, key );
			return PromisifyDbRequest( store.transaction );
		} );
	}
} )() );
