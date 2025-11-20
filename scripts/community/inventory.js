'use strict';

( ( () =>
{
	/** @type {Record<string, {packageid: number, owned: boolean}>} */
	const giftCache = {}; // TODO: Store this in indexeddb

	const scriptHook = document.getElementById( 'steamdb_inventory_hook' );
	const homepage = scriptHook.dataset.homepage;
	const logoSrc = scriptHook.dataset.logo;
	const optionsUrl = scriptHook.dataset.optionsUrl;
	const i18n = JSON.parse( scriptHook.dataset.i18n );
	const options = JSON.parse( scriptHook.dataset.options );

	const hasLinksEnabled = options[ 'link-inventory' ];
	const hasBadgeInfoEnabled = options[ 'enhancement-inventory-badge-info' ];
	let hasQuickSellEnabled = options[ 'enhancement-inventory-quick-sell' ] && window.g_bViewingOwnProfile && window.g_bMarketAllowed;
	let quickSellHeight = Number.parseInt( getComputedStyle( document.body ).getPropertyValue( '--steamdb-quick-sell-height' ), 10 ) || 0;

	/** @type {AbortController | null} */
	let currentAbortController = null;

	const dummySellEvent =
	{
		stop: () =>
		{
			// empty
		},
	};

	/**
	 * @this {HTMLAnchorElement}
	 */
	const OnQuickSellButtonClick = function( )
	{
		window.SellCurrentSelection();

		/** @type {HTMLInputElement} */
		const inputBuyer = document.querySelector( '#market_sell_buyercurrency_input' );
		inputBuyer.value = ( Number.parseFloat( this.dataset.price ) / 100.0 ).toString();
		inputBuyer.dispatchEvent( new Event( 'keyup', { bubbles: true } ) );

		/** @type {HTMLInputElement} */
		const inputSeller = document.querySelector( '#market_sell_currency_input' );
		inputSeller.dispatchEvent( new Event( 'keyup', { bubbles: true } ) );

		if( options[ 'enhancement-inventory-quick-sell-auto' ] )
		{
			// SSA must be accepted before OnAccept call, as it has a check for it
			/** @type {HTMLInputElement} */
			const ssa = document.querySelector( '#market_sell_dialog_accept_ssa' );
			ssa.checked = true;

			window.SellItemDialog.OnAccept( dummySellEvent );
			window.SellItemDialog.OnConfirmationAccept( dummySellEvent );
		}
	};

	const currencyCode = window.GetCurrencyCode( window.g_rgWalletInfo.wallet_currency );

	/**
	 * @param {number} valueInCents
	 */
	const FormatCurrency = ( valueInCents ) =>
		window.v_currencyformat( valueInCents, currencyCode, window.g_rgWalletInfo.wallet_country );

	if( options[ 'enhancement-inventory-no-sell-reload' ] )
	{
		let nextRefreshCausedBySell = false;
		const originalOnSuccess = window.SellItemDialog.OnSuccess;
		const originalReloadInventory = window.CUserYou.prototype.ReloadInventory;

		/**
		 * @param {any} transport
		 */
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

			return originalOnSuccess.apply( this, arguments );
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
				return originalReloadInventory.apply( this, arguments );
			}
		};
	}

	const originalRenderItemInfo = window.RenderItemInfo;

	/**
	 * @param {string} name
	 * @param {any} description
	 * @param {any} asset
	 */
	window.RenderItemInfo = function SteamDB_RenderItemInfo( name, description, asset )
	{
		/*
		if( !window.g_bViewingOwnProfile )
		{
			window.g_bIsTrading = true; // Hides sell button
			window.g_bMarketAllowed = true; // Has to be set so Valve's code doesn't try to bind a tooltip on non existing sell button
		}
		*/

		const container = document.getElementById( name );
		container.querySelector( 'steamdb-iteminfo-footer' )?.remove();

		const originalReturn = originalRenderItemInfo.apply( this, arguments );

		if( !description )
		{
			return originalReturn;
		}

		try
		{
			RenderItemInfo( container, description, asset );
		}
		catch( e )
		{
			console.error( '[SteamDB] RenderItemInfo error', e );
		}

		return originalReturn;
	};

	/**
	 * @param {HTMLElement} container
	 * @param {any} description
	 * @param {any} asset
	 */
	function RenderItemInfo( container, description, asset )
	{
		if( currentAbortController )
		{
			currentAbortController.abort();
		}

		currentAbortController = new AbortController();
		const abortController = currentAbortController;

		const footer = document.createElement( 'steamdb-iteminfo-footer' );
		footer.hidden = true;

		if( hasBadgeInfoEnabled && window.g_bViewingOwnProfile && description.appid === 753 && description.tags )
		{
			let itemClass = null;

			for( const tag of description.tags )
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

				footer.append( element );
				footer.hidden = false;

				LoadBadgeInformation( element, description, window.UserYou.GetSteamId() );
			}
		}

		if( hasLinksEnabled && description.appid === 753 && description.owner_actions )
		{
			let isGift = false;

			for( const action of description.owner_actions )
			{
				const url = new URL( action.link );

				if( url.pathname.startsWith( '/checkout/sendgift/' ) || url.pathname.startsWith( 'UnpackGift(' ) || url.pathname.startsWith( 'UnpackGiftItemReward(' ) )
				{
					isGift = true;
					break;
				}
			}

			if( isGift )
			{
				const element = document.createElement( 'div' );
				element.className = 'steamdb_gift_info';

				footer.append( element );
				footer.hidden = false;

				LoadGiftInformation( element, description.classid, asset.assetid, abortController.signal );
			}
		}

		if( hasQuickSellEnabled && description.marketable && !description.is_currency )
		{
			const element = document.createElement( 'div' );
			element.className = 'steamdb_quicksell';

			footer.append( element );
			footer.hidden = false;

			GetMarketItemNameId( description, ( commodityID ) =>
			{
				if( !commodityID )
				{
					return;
				}

				LoadQuickSellInformation( element, commodityID, description, abortController.signal );
			} );
		}

		requestAnimationFrame( () =>
		{
			container.append( footer );
		} );
	};

	/**
	 * @param {HTMLElement} element
	 * @param {string} commodityID
	 * @param {any} description
	 * @param {AbortSignal} signal
	 */
	function LoadQuickSellInformation( element, commodityID, description, signal )
	{
		const histogramParams = new URLSearchParams();
		histogramParams.set( 'country', window.g_rgWalletInfo.wallet_country );
		histogramParams.set( 'language', window.g_strLanguage );
		histogramParams.set( 'currency', window.g_rgWalletInfo.wallet_currency );
		histogramParams.set( 'item_nameid', commodityID );

		fetch( '/market/itemordershistogram?' + histogramParams.toString(), {
			signal,
			headers: {
				'X-Requested-With': 'SteamDB',
			},
		} )
			.then( ( response ) =>
			{
				if( response.status === 429 )
				{
					// If user is currently rate limited by Steam market, just disable the buttons
					hasQuickSellEnabled = false;
				}

				if( !response.ok )
				{
					return null;
				}

				return response.json();
			} )
			.then( ( data ) =>
			{
				if( !data || !data.success )
				{
					return;
				}

				const publisherFee = ( typeof description.market_fee !== 'undefined' && description.market_fee !== null ) ? description.market_fee : window.g_rgWalletInfo.wallet_publisher_fee_percent_default;

				const hoverText = document.createElement( 'div' );
				hoverText.className = 'steamdb_orders_hover_text';
				hoverText.textContent = i18n.inventory_list_at.replace( '%price%', FormatCurrency( 0 ) );

				const orderHeaderSummaries = document.createElement( 'div' );

				/**
				 * @param {HTMLElement} button
				 */
				const BindSellButton = ( button ) =>
				{
					button.addEventListener( 'click', OnQuickSellButtonClick );

					button.addEventListener( 'pointerenter', function()
					{
						const isSellNow = button.classList.contains( 'steamdb_buy_summary' );
						const str = isSellNow ? i18n.inventory_sell_at : i18n.inventory_list_at;

						const price = Number.parseInt( button.dataset.price, 10 );
						const priceFees = window.CalculateFeeAmount( price, publisherFee );
						const priceAfterFees = price - priceFees.fees;

						hoverText.textContent = str.replace( '%price%', FormatCurrency( price ) );

						const priceAfterFeesElement = document.createElement( 'span' );
						priceAfterFeesElement.textContent = ' → ' + FormatCurrency( priceAfterFees );
						hoverText.append( priceAfterFeesElement );

						hoverText.classList.add( 'steamdb_hover_visible' );
					} );

					button.addEventListener( 'pointerleave', function()
					{
						hoverText.classList.remove( 'steamdb_hover_visible' );
					} );
				};

				if( data.lowest_sell_order && data.sell_order_summary )
				{
					const sellHeader = document.createElement( 'div' );
					sellHeader.className = 'steamdb_orders_header steamdb_sell_summary';
					sellHeader.dataset.price = data.lowest_sell_order.toString();
					sellHeader.innerHTML = data.sell_order_summary;
					BindSellButton( sellHeader );
					orderHeaderSummaries.append( sellHeader );
				}

				if( data.highest_buy_order && data.buy_order_summary )
				{
					const buyHeader = document.createElement( 'div' );
					buyHeader.className = 'steamdb_orders_header steamdb_buy_summary';
					buyHeader.dataset.price = data.highest_buy_order.toString();
					buyHeader.innerHTML = data.buy_order_summary;
					BindSellButton( buyHeader );
					orderHeaderSummaries.append( buyHeader );
				}

				const orderHeader = document.createElement( 'div' );
				orderHeader.className = 'steamdb_order_header';
				orderHeader.append( orderHeaderSummaries );

				const logoImage = document.createElement( 'img' );
				logoImage.className = 'steamdb_icon';
				logoImage.src = logoSrc;

				const logoUrl = document.createElement( 'a' );
				logoUrl.title = i18n.steamdb_options;
				logoUrl.href = optionsUrl;
				logoUrl.target = '_blank';
				logoUrl.append( logoImage );
				orderHeader.append( logoUrl );

				element.append( orderHeader );

				const hoverTextContainer = document.createElement( 'div' );
				hoverTextContainer.append( hoverText );
				element.append( hoverTextContainer );

				for( const promote of element.querySelectorAll( '.market_commodity_orders_header_promote' ) )
				{
					promote.className = 'steamdb_orders_header_promote';
				}

				if( data.sell_order_table )
				{
					element.insertAdjacentHTML( 'beforeend', data.sell_order_table );

					/** @type {HTMLTableElement} */
					const table = element.querySelector( '.market_commodity_orders_table' );
					table.className = 'steamdb_orders_table';

					const rows = table.querySelectorAll( 'tr' );

					for( const row of rows )
					{
						const td = row.querySelector( 'td' );

						if( !td )
						{
							continue;
						}

						const priceText = td.textContent.trim();
						const priceValue = window.GetPriceValueAsInt( priceText );

						if( priceValue < 1 )
						{
							continue;
						}

						row.classList.add( 'steamdb_order_row_clickable' );
						row.dataset.price = priceValue.toString();
						BindSellButton( row );
					}

					if( data.lowest_sell_order )
					{
						const undercutPrice = data.lowest_sell_order - 1;
						const undercutPriceFees = window.CalculateFeeAmount( undercutPrice, publisherFee );

						if( undercutPrice - undercutPriceFees.fees > 0 && undercutPrice > data.highest_buy_order )
						{
							const row = document.createElement( 'tr' );
							row.classList.add( 'steamdb_order_row_clickable' );
							row.style.fontStyle = 'italic';
							row.dataset.price = undercutPrice.toString();

							const priceCell = document.createElement( 'td' );
							priceCell.textContent = FormatCurrency( undercutPrice );
							row.append( priceCell );

							const quantityCell = document.createElement( 'td' );
							row.append( quantityCell );

							BindSellButton( row );
							rows[ 0 ].after( row );
						}
					}

					element.classList.add( 'steamdb_quicksell_visible' );

					const actualHeight = element.offsetHeight;

					if( actualHeight > quickSellHeight )
					{
						quickSellHeight = actualHeight;
						document.body.style.setProperty( '--steamdb-quick-sell-height', `${actualHeight}px` );
					}
				}
			} )
			.catch( ( e ) =>
			{
				if( e.name !== 'AbortError' )
				{
					console.error( '[SteamDB] Quick sell error', e );
				}
			} );
	}

	/**
	 * @param {HTMLElement} element
	 * @param {string} classid
	 * @param {string} assetid
	 * @param {AbortSignal} signal
	 */
	function LoadGiftInformation( element, classid, assetid, signal )
	{
		const linkSpan = document.createElement( 'span' );
		linkSpan.textContent = i18n.view_on_steamdb;

		const link = document.createElement( 'a' );
		link.className = 'btnv6_blue_hoverfade btn_small_thin';
		link.href = '#';
		link.target = '_blank';
		link.append( linkSpan );

		element.append( link );

		const CreateOwnedIcon = () =>
		{
			const ownedSpan = document.createElement( 'span' );
			ownedSpan.textContent = ' ' + i18n.in_library;

			const ownedIcon = document.createElement( 'i' );
			ownedIcon.className = 'ico16 thumb_upv6';
			ownedSpan.prepend( ownedIcon );

			const ownedLink = document.createElement( 'a' );
			ownedLink.className = 'btnv6_blue_hoverfade btn_small_thin';
			ownedLink.append( ownedSpan );

			element.append( ownedLink );
		};

		if( giftCache[ classid ] )
		{
			link.href = `${homepage}sub/${giftCache[ classid ].packageid}/`;

			if( giftCache[ classid ].owned )
			{
				CreateOwnedIcon();
			}

			return;
		}

		link.classList.add( 'btn_disabled' );

		// Fetch gift information
		fetch( `/gifts/${assetid}/validateunpack`, {
			signal,
			headers: {
				'X-Requested-With': 'SteamDB',
			},
		} )
			.then( ( response ) => response.json() )
			.then( ( data ) =>
			{
				if( data?.packageid )
				{
					giftCache[ classid ] = { packageid: data.packageid, owned: data.owned || false };

					link.classList.remove( 'btn_disabled' );
					link.href = `${homepage}sub/${data.packageid}/`;

					if( data.owned )
					{
						CreateOwnedIcon();
					}
				}
			} )
			.catch( ( err ) =>
			{
				if( err.name !== 'AbortError' )
				{
					console.error( '[SteamDB] Gift info error', err );
				}
			} );
	}

	let badgesDataLoaded = false;

	/** @type {any[]} */
	let badgesData = [];

	/**
	 * @param {HTMLElement} element
	 * @param {any} description
	 * @param {string} steamid
	 */
	function AddBadgeInformation( element, description, steamid )
	{
		if( !description.market_fee_app )
		{
			return;
		}

		let isTradingCard = false;
		let isFoilCard = false;
		let foundBadge = false;

		for( const tag of description.tags )
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

		/**
		 * @param {boolean} foil
		 */
		const CreateLink = ( foil ) =>
			`https://steamcommunity.com/profiles/${steamid}/gamecards/${description.market_fee_app}${foil ? '?border=1' : ''}`;

		for( const badge of badgesData )
		{
			if( badge.appid !== description.market_fee_app )
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
	}

	/**
	 * @param {HTMLElement} element
	 * @param {any} description
	 * @param {string} steamid
	 */
	function LoadBadgeInformation( element, description, steamid )
	{
		if( badgesDataLoaded )
		{
			if( badgesData.length > 0 )
			{
				AddBadgeInformation( element, description, steamid );
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

					AddBadgeInformation( element, description, steamid );
				}
			} )
			.catch( ( err ) =>
			{
				console.error( '[SteamDB] Badge info error', err );
			} );
	}

	/**
	 * @param {any} description
	 * @param {(commodityID: string|null) => void} callback
	 */
	function GetMarketItemNameId( description, callback )
	{
		const appid = description.appid;
		const marketHashName = encodeURIComponent( window.GetMarketHashName( description ) );
		const cacheKey = `${appid}_${marketHashName}`;

		GetCachedItemId( cacheKey )
			.then( ( value ) =>
			{
				if( value )
				{
					callback( value );
					return;
				}

				fetch( `/market/listings/${appid}/${marketHashName}`, {
					headers: {
						'X-Requested-With': 'SteamDB',
					},
				} )
					.then( ( response ) =>
					{
						if( response.status === 429 )
						{
							// If user is currently rate limited by Steam market, just disable the buttons
							hasQuickSellEnabled = false;
						}

						if( !response.ok )
						{
							callback( null );
							return null;
						}

						return response.text();
					} )
					.then( ( data ) =>
					{
						if( !data )
						{
							return;
						}

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
					} )
					.catch( ( err ) =>
					{
						console.error( '[SteamDB] Fetch error', err );

						callback( null );
					} );
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

	/**
	 * Promisifies an IndexedDB request
	 * @param {IDBRequest<T>|IDBTransaction} request - The IndexedDB request to promisify
	 * @returns {Promise<T>} A promise that resolves with the request result
	 * @template T
	 */
	function PromisifyDbRequest( request )
	{
		return new Promise( ( resolve, reject ) =>
		{
			// @ts-ignore
			request.oncomplete = request.onsuccess = () => resolve( request.result );
			// @ts-ignore
			request.onabort = request.onerror = () => reject( request.error );
		} );
	}

	/**
	 * Creates an IndexedDB store with the specified name
	 * @param {string} dbName - The name of the database
	 * @param {string} storeName - The name of the object store
	 * @returns {function(IDBTransactionMode, function(IDBObjectStore): T|PromiseLike<T>): Promise<T>} A function that executes callbacks against the store
	 * @template T
	 */
	function CreateItemStore( dbName, storeName )
	{
		const request = indexedDB.open( dbName );
		request.onupgradeneeded = () => request.result.createObjectStore( storeName );
		const dbp = PromisifyDbRequest( request );
		return ( txMode, callback ) => dbp.then( ( db ) => callback( db.transaction( storeName, txMode ).objectStore( storeName ) ) );
	}

	/**
	 * Get a value by its key.
	 * @param {IDBValidKey} key - The key to look up
	 * @returns {Promise<string|undefined>} A promise that resolves with the stored value or undefined if not found
	 */
	function GetCachedItemId( key )
	{
		return itemDatabase( 'readonly', ( store ) => PromisifyDbRequest( store.get( key ) ) );
	}

	/**
	 * Set a value with a key.
	 * @param {IDBValidKey} key - The key to store the value under
	 * @param {string} value - The value to store
	 * @returns {Promise<void>} A promise that resolves when the transaction completes
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
