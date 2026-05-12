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

	const dummySellEvent = {
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
	const numberFormatter = new Intl.NumberFormat( window.g_strLanguage );

	/**
	 * @param {number} valueInCents
	 */
	const FormatCurrency = ( valueInCents ) =>
		window.v_currencyformat( valueInCents, currencyCode, window.g_rgWalletInfo.wallet_country );

	/**
	 * @param {HTMLElement} target
	 * @param {string} template
	 * @param {string} count
	 * @param {string} price
	 */
	const RenderPromotedSummary = ( target, template, count, price ) =>
	{
		target.innerHTML = template
			.replace( '%count%', `<span class="steamdb_orders_header_promote">${count}</span>` )
			.replace( '%price%', `<span class="steamdb_orders_header_promote">${price}</span>` );
	};

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

				return undefined;
			}

			return originalReloadInventory.apply( this, arguments );
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

			LoadQuickSellInformation( element, description, asset, abortController.signal );
		}

		if( container.lastChild )
		{
			container.append( footer );
		}
		else
		{
			const observer = new MutationObserver( ( mutations ) =>
			{
				for( const mutation of mutations )
				{
					if( mutation.type === 'childList' && container.lastChild )
					{
						container.append( footer );
						observer.disconnect();
						break;
					}
				}
			} );

			observer.observe( container, {
				childList: true
			} );
		}
	};

	/**
	 * @param {HTMLElement} element
	 * @param {any} description
	 * @param {any} asset
	 * @param {AbortSignal} signal
	 */
	function LoadQuickSellInformation( element, description, asset, signal )
	{
		const bucketId = /* description.market_bucket_group_id || */ description.market_hash_name || description.market_name || description.name;

		const params = new URLSearchParams();
		params.set( 'q', 'Load' );
		params.set( 'qp', JSON.stringify( [ description.appid, bucketId ] ) );

		fetch( '/market/orderbook?' + params.toString(), {
			signal,
			headers: {
				'X-Requested-With': 'SteamDB',
				'X-Valve-Request-Type': 'queryAction',
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
			.then( ( response ) =>
			{
				if( !response || !response.success || !response.data )
				{
					return;
				}

				const data = response.data;

				const hoverText = document.createElement( 'div' );
				hoverText.className = 'steamdb_orders_hover_text';
				hoverText.textContent = i18n.inventory_quick_sell_tip;

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
						const priceAfterFees = window.GetItemPriceFromTotal( price, window.g_rgWalletInfo );

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

				if( data.cSellOrders > 0 && data.amtMinSellOrder )
				{
					const sellHeader = document.createElement( 'div' );
					sellHeader.className = 'steamdb_orders_header steamdb_sell_summary';
					RenderPromotedSummary(
						sellHeader,
						i18n.inventory_orders_for_sale,
						numberFormatter.format( data.cSellOrders ),
						FormatCurrency( data.amtMinSellOrder )
					);

					sellHeader.dataset.price = data.amtMinSellOrder.toString();
					BindSellButton( sellHeader );

					orderHeaderSummaries.append( sellHeader );
				}

				if( data.cBuyOrders > 0 && data.amtMaxBuyOrder )
				{
					const buyHeader = document.createElement( 'div' );
					buyHeader.className = 'steamdb_orders_header steamdb_buy_summary';
					RenderPromotedSummary(
						buyHeader,
						i18n.inventory_orders_to_buy,
						numberFormatter.format( data.cBuyOrders ),
						FormatCurrency( data.amtMaxBuyOrder )
					);

					buyHeader.dataset.price = data.amtMaxBuyOrder.toString();
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

				const sellOrders = data.rgCompactSellOrders || [];
				/** @type {HTMLTableRowElement | null} */
				let firstSellRow = null;

				if( sellOrders.length >= 2 )
				{
					const table = document.createElement( 'table' );
					table.className = 'steamdb_orders_table';

					const totalRows = sellOrders.length / 2;
					const hasOverflow = totalRows > 6;
					const visibleRows = hasOverflow ? 5 : totalRows;
					let sumOfVisible = 0;

					for( let i = 0; i < visibleRows; ++i )
					{
						const price = sellOrders[ i * 2 ];
						const quantity = sellOrders[ i * 2 + 1 ];
						sumOfVisible += quantity;

						const row = document.createElement( 'tr' );
						row.classList.add( 'steamdb_order_row_clickable' );
						row.dataset.price = price.toString();

						const priceCell = document.createElement( 'td' );
						priceCell.textContent = FormatCurrency( price );
						row.append( priceCell );

						const quantityCell = document.createElement( 'td' );
						quantityCell.textContent = numberFormatter.format( quantity );
						row.append( quantityCell );

						BindSellButton( row );
						table.append( row );

						if( i === 0 )
						{
							firstSellRow = row;
						}
					}

					if( hasOverflow )
					{
						const cutoffPrice = sellOrders[ visibleRows * 2 ];
						const aggregateQty = ( data.cSellOrders || 0 ) - sumOfVisible;

						const row = document.createElement( 'tr' );
						row.classList.add( 'steamdb_order_row_clickable' );
						row.dataset.price = cutoffPrice.toString();

						const priceCell = document.createElement( 'td' );
						priceCell.textContent = i18n.inventory_orders_or_more.replace( '%price%', FormatCurrency( cutoffPrice ) );
						row.append( priceCell );

						const quantityCell = document.createElement( 'td' );
						quantityCell.textContent = numberFormatter.format( aggregateQty );
						row.append( quantityCell );

						BindSellButton( row );
						table.append( row );
					}

					element.append( table );
				}

				if( firstSellRow && data.amtMinSellOrder )
				{
					const nFloor = Number.parseInt( window.g_rgWalletInfo.wallet_market_minimum ?? 1, 10 );
					const nIncrement = Number.parseInt( window.g_rgWalletInfo.wallet_currency_increment ?? 1, 10 );
					const undercutPrice = data.amtMinSellOrder - nIncrement;

					if( undercutPrice >= ( 3 * nFloor ) && undercutPrice > ( data.amtMaxBuyOrder || 0 ) )
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
						firstSellRow.before( row );
					}
				}

				if( description.commodity )
				{
					const multiSellParams = new URLSearchParams();
					multiSellParams.set( 'appid', asset.appid );
					multiSellParams.set( 'contextid', asset.contextid );
					multiSellParams.set( 'items[]', window.GetMarketHashName( description ) );

					const multiSellBtn = document.createElement( 'a' );
					multiSellBtn.className = 'steamdb_multi_sell';
					multiSellBtn.href = `https://steamcommunity.com/market/multisell?${multiSellParams.toString()}`;
					multiSellBtn.textContent = i18n.inventory_sell_multiple;
					element.append( multiSellBtn );
				}

				element.classList.add( 'steamdb_quicksell_visible' );

				const actualHeight = element.offsetHeight;

				if( actualHeight > quickSellHeight )
				{
					quickSellHeight = actualHeight;
					document.body.style.setProperty( '--steamdb-quick-sell-height', `${actualHeight}px` );
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

	/** @type {Promise<any[]> | null} */
	let badgesDataPromise = null;

	/**
	 * @param {HTMLElement} element
	 * @param {any} description
	 * @param {string} steamid
	 * @param {any[]} badges
	 */
	function AddBadgeInformation( element, description, steamid, badges )
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

		for( const badge of badges )
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
		if( !badgesDataPromise )
		{
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

			badgesDataPromise = fetch( `${applicationConfig.WEBAPI_BASE_URL}IPlayerService/GetBadges/v1/?${params.toString()}` )
				.then( ( response ) => response.json() )
				.then( ( /** @type {any} */ response ) => /** @type {any[]} */ ( response.response?.badges ?? [] ) )
				.catch( ( /** @type {any} */ err ) =>
				{
					console.error( '[SteamDB] Badge info error', err );
					return /** @type {any[]} */ ( [] );
				} );
		}

		badgesDataPromise.then( ( badges ) =>
		{
			if( badges.length > 0 )
			{
				AddBadgeInformation( element, description, steamid, badges );
			}
		} );
	}
} )() );
