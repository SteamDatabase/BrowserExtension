/* global AddLinksInErrorBox */

'use strict';

const container = document.getElementById( 'error_box' );
const language = GetLanguage();
const numberFormatter = new Intl.NumberFormat( language );

if( container )
{
	AddLinksInErrorBox( container );
}
else
{
	GetOption( {
		'button-app': true,
		'button-pcgw': true,
		'link-subid': true,
		'online-stats': true,
		'steamdb-lowest-price': true,
		'steamdb-rating': true,
		'steamdb-last-update': true,
		'steamdb-dev-pub-links': true,
		'enhancement-hide-mobile-app-button': false,
		'collapse-already-in-library': false,
		'enhancement-hide-install-button': true,
	}, ( items ) =>
	{
		if( ( items[ 'steamdb-last-update' ] || items[ 'online-stats' ] ) && !document.querySelector( '.game_area_dlc_bubble' ) )
		{
			DrawOnlineStatsWidget( items );
		}

		if( items[ 'steamdb-lowest-price' ] )
		{
			DrawLowestPrice();
		}

		if( items[ 'enhancement-hide-install-button' ] )
		{
			// On app page, `Install Steam` and `Play Now` buttons share the same `.game_area_already_owned_btn` class.
			// To distinguish them, we are hiding the first one only if href attribute points to /about/ to avoid
			// hiding the `Play Now` button or any other in the event Valve decides to change the order.

			/** @type {HTMLAnchorElement} */
			const button = document.querySelector( '.game_area_already_owned_btn:first-of-type a' );

			if( button && button.pathname === "/about/" )
			{
				button.setAttribute( 'hidden', 'true' );
				button.style.display = 'none';
			}
		}

		if( items[ 'enhancement-hide-mobile-app-button' ] )
		{
			/** @type {HTMLMetaElement} */
			let button = document.querySelector( '.open_in_steam_container' );

			if( button )
			{
				button.setAttribute( 'hidden', 'true' );
				button.style.display = 'none';
			}

			button = document.querySelector( '.banner_open_in_steam' );

			if( button )
			{
				button.setAttribute( 'hidden', 'true' );
			}
		}

		if( items[ 'button-app' ] )
		{
			let container = document.querySelector( '.apphub_OtherSiteInfo' );

			if( !container )
			{
				// Steam China has no community hub
				const headerStandardTop = document.querySelector( '.apphub_HeaderStandardTop' );

				if( headerStandardTop )
				{
					container = document.createElement( 'div' );
					container.className = 'apphub_OtherSiteInfo';
					headerStandardTop.prepend( container );
				}
			}

			if( container )
			{
				const link = document.createElement( 'a' );
				link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
				link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';

				const element = document.createElement( 'span' );
				element.dataset.tooltipText = _t( 'view_on_steamdb' );
				link.appendChild( element );

				const image = document.createElement( 'img' );
				image.className = 'ico16';
				image.src = GetLocalResource( 'icons/white.svg' );

				element.appendChild( image );

				container.insertBefore( link, container.firstChild );
			}

			const lastLinkBar = document.querySelector( '#appDetailsUnderlinedLinks .linkbar:last-child' );

			if( lastLinkBar )
			{
				const link = document.createElement( 'a' );
				link.className = 'linkbar linkbar_steamdb';
				link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';

				const image = document.createElement( 'img' );
				image.src = GetLocalResource( 'icons/white.svg' );
				link.append( image );

				const span = document.createElement( 'span' );
				span.className = 'social_account';
				span.textContent = _t( 'view_on_steamdb' );
				link.append( span );

				lastLinkBar.insertAdjacentElement( 'afterend', link );
			}
		}

		if( items[ 'button-pcgw' ] )
		{
			let container = document.querySelector( '.apphub_OtherSiteInfo' );

			if( !container )
			{
				// Steam China has no community hub
				const headerStandardTop = document.querySelector( '.apphub_HeaderStandardTop' );

				if( headerStandardTop )
				{
					container = document.createElement( 'div' );
					container.className = 'apphub_OtherSiteInfo';
					headerStandardTop.prepend( container );
				}
			}

			if( container )
			{
				const link = document.createElement( 'a' );
				link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
				link.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=SteamDB';

				const element = document.createElement( 'span' );
				element.dataset.tooltipText = _t( 'view_on_pcgamingwiki' );
				link.appendChild( element );

				const image = document.createElement( 'img' );
				image.className = 'ico16';
				image.src = GetLocalResource( 'icons/pcgamingwiki.svg' );

				element.appendChild( image );

				container.insertBefore( link, container.firstChild );
				container.insertBefore( document.createTextNode( ' ' ), link.nextSibling );
			}

			const lastLinkBar = document.querySelector( '#appDetailsUnderlinedLinks .linkbar:last-child' );

			if( lastLinkBar )
			{
				const link = document.createElement( 'a' );
				link.className = 'linkbar linkbar_steamdb';
				link.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=SteamDB';

				const image = document.createElement( 'img' );
				image.src = GetLocalResource( 'icons/pcgamingwiki.svg' );
				link.append( image );

				const span = document.createElement( 'span' );
				span.className = 'social_account';
				span.textContent = _t( 'view_on_pcgamingwiki' );
				link.append( span );

				lastLinkBar.insertAdjacentElement( 'afterend', link );
			}
		}

		if( items[ 'link-subid' ] )
		{
			// Find each "add to cart" button
			/** @type {NodeListOf<HTMLInputElement>} */
			let container = document.querySelectorAll( 'input[name="subid"]' );

			let hasDropdowns = false;

			for( const inputElement of container )
			{
				const subid = inputElement.value;
				let element = inputElement.parentElement.parentElement;

				// Is this a subscription selector?
				if( subid.length > 0 )
				{
					if( element.className === 'game_purchase_action_bg' ) // series episode
					{
						element = element.parentElement;
					}
					else
					{
						element = element.querySelector( '.game_purchase_action' );
					}

					if( element )
					{
						InsertPurchaseBlockId( element, 'sub', Number.parseInt( subid, 10 ) );
					}
				}
				else if( element.querySelector( '.game_area_purchase_game_dropdown_selection' ) )
				{
					hasDropdowns = true;

					InsertPurchaseBlockId( element, 'sub', 0 );
				}
			}

			// Add license for free apps
			container = document.querySelectorAll( '.btn_addtocart > span[onclick]' );

			for( const element of container )
			{
				const subid = element.getAttribute( 'onclick' ).match( /AddFreeLicense\(\s*(?<id>[0-9]+)/ );

				if( !subid )
				{
					continue;
				}

				InsertPurchaseBlockId( element.closest( '.game_purchase_action' ), 'sub', Number.parseInt( subid.groups.id, 10 ) );
			}

			// Link appid in demo download banner
			let element = document.querySelector( '.demo_above_purchase' );

			if( element )
			{
				/** @type {HTMLAnchorElement} */
				const demoGameBtn = element.querySelector( '#demoGameBtn a' );

				if( demoGameBtn )
				{
					const appid = demoGameBtn.href.match( /\/install\/(?<id>[0-9]+)/ );

					if( appid )
					{
						InsertPurchaseBlockId( element.querySelector( '.game_purchase_action' ), 'app', Number.parseInt( appid.groups.id, 10 ) );
					}
				}
			}

			// Link appid in playtest banner
			element = document.querySelector( '.game_area_purchase_game.pt_active' );

			if( element )
			{
				/** @type {HTMLAnchorElement} */
				const playtestBtn = element.querySelector( '.game_purchase_action a' );

				if( playtestBtn )
				{
					const appid = playtestBtn.href.match( /\/run\/(?<id>[0-9]+)/ );

					if( appid )
					{
						InsertPurchaseBlockId( element.querySelector( '.game_purchase_action' ), 'app', Number.parseInt( appid.groups.id, 10 ) );
					}
				}
			}

			// Bundles
			container = document.querySelectorAll( 'input[name="bundleid"]' );

			for( const element of container )
			{
				InsertPurchaseBlockId( element.closest( '.game_area_purchase_game' ).querySelector( '.game_purchase_action' ), 'bundle', Number.parseInt( element.value, 10 ) );
			}

			// We have to inject our JS directly into the page to hook Steam's functionatily
			if( hasDropdowns )
			{
				const script = document.createElement( 'script' );
				script.id = 'steamdb_subscriptions_hook';
				script.type = 'text/javascript';
				script.src = GetLocalResource( 'scripts/store/subscriptions.js' );
				script.dataset.homepage = GetHomepage();

				document.head.appendChild( script );
			}
		}

		if( items[ 'steamdb-rating' ] )
		{
			const positiveVoteText = document.querySelector( 'label[for="review_type_positive"] .user_reviews_count' );
			const negativeVoteText = document.querySelector( 'label[for="review_type_negative"] .user_reviews_count' );

			if( positiveVoteText && negativeVoteText )
			{
				const positiveVotes = Number.parseInt( positiveVoteText.textContent.replace( /[(.,\s)]/g, '' ), 10 );
				const totalVotes = positiveVotes + Number.parseInt( negativeVoteText.textContent.replace( /[(.,\s)]/g, '' ), 10 );
				const average = positiveVotes / totalVotes;
				const score = average - ( average - 0.5 ) * ( 2 ** -Math.log10( totalVotes + 1 ) );

				let ratingClass = 'poor';

				if( totalVotes < 500 )
				{
					ratingClass = 'white';
				}
				else if( score > 0.74 )
				{
					ratingClass = 'good';
				}
				else if( score > 0.49 )
				{
					ratingClass = 'average';
				}

				const container = document.createElement( 'div' );
				container.className = 'user_reviews_summary_row';
				container.dataset.tooltipText = _t( 'app_steamdb_rating_tooltip', [ FormatNumber( positiveVotes ), FormatNumber( totalVotes ) ] );

				const subtitle = document.createElement( 'div' );
				subtitle.className = 'subtitle column';
				subtitle.textContent = _t( 'app_steamdb_rating' );

				const summary = document.createElement( 'div' );
				summary.className = 'summary column';

				const link = document.createElement( 'a' );
				link.className = `steamdb_rating steamdb_rating_${ratingClass}`;
				link.href = `${GetHomepage()}app/${GetCurrentAppID()}/charts/#reviews`;
				link.textContent = ( score * 100 ).toFixed( 2 ) + '% ';
				summary.appendChild( link );

				const responsiveText = document.createElement( 'span' );
				responsiveText.className = 'responsive_reviewdesc_short';
				responsiveText.textContent = _t( 'app_steamdb_rating_responsive' );
				summary.appendChild( responsiveText );

				container.appendChild( subtitle );
				container.appendChild( summary );

				let element = document.querySelector( '#userReviews' );
				if( element )
				{
					// Need an extra div wrapper because Valve's tooltip bind code looks inside added nodes
					const wrapper = document.createElement( 'div' );
					wrapper.append( container );
					element.append( wrapper );
				}

				element = document.querySelector( '#userReviews_responsive' );
				if( element )
				{
					element.appendChild( container.cloneNode( true ) );
				}
			}
		}

		if( items[ 'steamdb-dev-pub-links' ] )
		{
			AddLinksToDevelopers();
		}

		// Add a collapse button to the "already in library" block which hides the review block
		AddCollapseButtonToAlreadyInLibraryBlock( items );
	} );

	// Make family share banner a link to the Steam client
	MakeGameInFamilyLinkToLibrary();

	// Valve does not invalidate cache for follow button, so we catch it here
	FollowInvalidateCache();

	// Hide steamdb curator for steamdb extension users
	HideCurator();
}

function DrawLowestPrice()
{
	/** @type {HTMLMetaElement} */
	const price = document.querySelector( 'meta[itemprop="price"]' );

	if( price && price.content !== '' )
	{
		const parsedPrice = Number.parseFloat( price.content.replace( ',', '.' ) );

		WriteLog( 'Parsed current price as', parsedPrice );

		// Do not request lowest prices if this app is free
		if( parsedPrice < 0.01 )
		{
			return;
		}
	}

	/** @type {HTMLMetaElement} */
	const currencyElement = document.querySelector( 'meta[itemprop="priceCurrency"]' );

	/** @type {string | null} */
	let currency = currencyElement ? currencyElement.content : null;

	if( !currency )
	{
		currency = 'USD';

		WriteLog( 'Missing priceCurrency, forced to USD' );
	}

	if( currency === 'USD' )
	{
		// We only need to know the country if currency is USD
		// as all other currencies are uniquely mapped already
		const script = document.evaluate( '//script[contains(text(), "EnableSearchSuggestions")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
		let country = null;

		if( script )
		{
			const result = script.textContent.match( /EnableSearchSuggestions\(.+?'(?<cc>[A-Z]{2})',/ );

			if( result )
			{
				country = result.groups.cc;

				WriteLog( `Matched country as "${country}" from search script` );
			}
			else
			{
				WriteLog( 'Failed to find country in search script' );
			}
		}

		// Map countries that use USD but different pricing region to their own unique currency name
		// This is done here to not send user's country to the server and to increase cache hits
		// See https://partner.steamgames.com/doc/store/pricing/currencies
		switch( country )
		{
			case 'AZ': // Azerbaijan
			case 'AM': // Armenia
			case 'BY': // Belarus
			case 'GE': // Georgia
			case 'KG': // Kyrgyzstan
			case 'MD': // Moldova
			case 'TJ': // Tajikistan
			case 'TM': // Turkmenistan
			case 'UZ': // Uzbekistan
				currency = 'USD-CIS';
				break;

			case 'BD': // Bangladesh
			case 'BT': // Bhutan
			case 'NP': // Nepal
			case 'PK': // Pakistan
			case 'LK': // Sri Lanka
				currency = 'USD-SASIA';
				break;

			case 'AR': // Argentina
			case 'BO': // Bolivia
			case 'BZ': // Belize
			case 'EC': // Ecuador
			case 'GT': // Guatemala
			case 'GY': // Guyana
			case 'HN': // Honduras
			case 'NI': // Nicaragua
			case 'PA': // Panama
			case 'PY': // Paraguay
			case 'SR': // Suriname
			case 'SV': // El Salvador
			case 'VE': // Venezuela
				currency = 'USD-LATAM';
				break;

			case 'BH': // Bahrain
			case 'DZ': // Algeria
			case 'EG': // Egypt
			case 'IQ': // Iraq
			case 'JO': // Jordan
			case 'LB': // Lebanon
			case 'LY': // Libya
			case 'MA': // Morocco
			case 'OM': // Oman
			case 'PS': // Palestine
			case 'SD': // Sudan
			case 'TN': // Tunisia
			case 'TR': // Turkey
			case 'YE': // Yemen
				currency = 'USD-MENA';
				break;
		}
	}
	else if( currency === 'CNY' && window.location.hostname === 'store.steamchina.com' )
	{
		currency = 'CNY-XC';
	}

	WriteLog( `Currency is "${currency}"` );

	// Container
	const container = document.getElementById( 'game_area_purchase' );

	if( !container )
	{
		return;
	}

	const element = document.createElement( 'a' );
	element.className = 'steamdb_prices';
	element.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
	element.dir = _t( '@@bidi_dir' );

	const image = document.createElement( 'img' );
	image.src = GetLocalResource( 'icons/white.svg' );
	element.appendChild( image );

	const top = document.createElement( 'div' );
	top.className = 'steamdb_prices_top';
	top.innerHTML = _t( 'app_lowest_price', [ '…' ] );

	const bottom = document.createElement( 'div' );
	bottom.className = 'steamdb_prices_bottom';
	bottom.innerHTML = _t( 'app_lowest_date', [ '…', '…' ] );

	const textContainer = document.createElement( 'div' );
	textContainer.appendChild( top );
	textContainer.appendChild( bottom );
	element.appendChild( textContainer );

	container.insertAdjacentElement( 'afterbegin', element );

	SendMessageToBackgroundScript( {
		contentScriptQuery: 'GetAppPrice',
		appid: GetCurrentAppID(),
		currency,
	}, ( response ) =>
	{
		if( !response || !response.success )
		{
			if( response?.error )
			{
				WriteLog( `GetAppPrice failed to load: ${response.error}` );
			}
			else
			{
				WriteLog( 'GetAppPrice failed to load' );
			}

			element.remove();

			return;
		}

		WriteLog( 'GetAppPrice loaded' );

		// We trust the API, but this ensures safety
		/**
		 * @param {string} str
		 */
		const escapeHtml = ( str ) => str
			.replaceAll( '&', '&amp;' )
			.replaceAll( '<', '&lt;' )
			.replaceAll( '"', '&quot;' )
			.replaceAll( "'", '&apos;' );

		const safePrice = escapeHtml( response.data.p );

		if( response.data.l )
		{
			top.innerHTML = _t( 'app_lowest_price_limited', [ safePrice, escapeHtml( response.data.l ) ] );
		}
		else if( Number.isInteger( response.data.d ) && response.data.d > 0 )
		{
			top.innerHTML = _t( 'app_lowest_price_discount', [ safePrice, response.data.d.toString() ] );
		}
		else
		{
			top.innerHTML = _t( 'app_lowest_price', [ safePrice ] );
		}

		// Dates
		const dateFormatter = new Intl.DateTimeFormat( language, { dateStyle: 'medium' } );
		const lastOn = dateFormatter.format( response.data.t * 1000 );
		const [ , relativeText ] = FormatRelativeDate( response.data.t );

		if( Number.isInteger( response.data.c ) && response.data.c > 1 )
		{
			bottom.textContent = _t( 'app_lowest_date_multiple', [
				lastOn,
				relativeText,
				response.data.c.toString(),
			] );
		}
		else
		{
			bottom.textContent = _t( 'app_lowest_date', [ lastOn, relativeText ] );
		}
	} );
}

async function FetchSteamApiCurrentPlayers()
{
	const applicationConfigElement = document.getElementById( 'application_config' );

	if( !applicationConfigElement )
	{
		WriteLog( 'Failed to get application_config' );
		return;
	}

	const applicationConfig = JSON.parse( applicationConfigElement.dataset.config );
	const webApiBaseUrl = applicationConfig.WEBAPI_BASE_URL;

	if( !webApiBaseUrl )
	{
		WriteLog( 'Failed to get WEBAPI_BASE_URL' );
		return;
	}

	const params = new URLSearchParams();
	params.set( 'origin', location.origin );
	params.set( 'appid', GetCurrentAppID().toString() );

	const response = await fetch(
		`${webApiBaseUrl}ISteamUserStats/GetNumberOfCurrentPlayers/v1/?${params.toString()}`,
		{
			headers: {
				Accept: 'application/json',
			}
		}
	);

	if( !response.ok )
	{
		return 0;
	}

	const data = await response.json();

	if( data && data.response && data.response.player_count > 0 )
	{
		return data.response.player_count;
	}

	return 0;
}

/**
 * @param {{ [key: string]: any }} items
 */
function DrawOnlineStatsWidget( items )
{
	let block = null;
	let onlineNow = null;
	let peakToday = null;
	let peakAll = null;
	let followers = null;
	let steamApiPlayersFetch = null;

	if( items[ 'online-stats' ] )
	{
		const container = document.querySelector( '.game_meta_data' );

		if( !container )
		{
			return;
		}

		steamApiPlayersFetch = FetchSteamApiCurrentPlayers();

		const blockInner = document.createElement( 'div' );
		blockInner.className = 'block_content_inner';

		block = document.createElement( 'div' );
		block.className = 'block responsive_apppage_details_right steamdb_stats';
		block.appendChild( blockInner );

		// Logo and link
		const link = document.createElement( 'a' );
		link.className = 'steamdb_stats_logo';
		link.dataset.tooltipText = _t( 'view_on_steamdb' );
		link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/charts/';

		const image = document.createElement( 'img' );
		image.src = GetLocalResource( 'icons/white.svg' );
		link.appendChild( image );

		const grid = document.createElement( 'div' );
		grid.className = 'steamdb_stats_grid';
		grid.dir = _t( '@@bidi_dir' );

		blockInner.append( grid );
		blockInner.append( link );

		// Online now
		onlineNow = document.createElement( 'span' );
		onlineNow.className = 'steamdb_stats_number';
		onlineNow.textContent = '…';

		let lineText = document.createElement( 'span' );
		lineText.className = 'steamdb_stats_name';
		lineText.textContent = _t( 'app_stats_online_now' );
		grid.append( lineText );
		grid.append( onlineNow );

		// Peak today
		peakToday = document.createElement( 'span' );
		peakToday.className = 'steamdb_stats_number';
		peakToday.textContent = '…';

		lineText = document.createElement( 'span' );
		lineText.className = 'steamdb_stats_name';
		lineText.textContent = _t( 'app_stats_peak_today' );
		grid.append( lineText );
		grid.append( peakToday );

		// Peak all
		peakAll = document.createElement( 'span' );
		peakAll.className = 'steamdb_stats_number';
		peakAll.textContent = '…';

		lineText = document.createElement( 'span' );
		lineText.className = 'steamdb_stats_name';
		lineText.textContent = _t( 'app_stats_alL_time_peak' );
		grid.append( lineText );
		grid.append( peakAll );

		// Followers
		followers = document.createElement( 'span' );
		followers.className = 'steamdb_stats_number';
		followers.textContent = '…';

		lineText = document.createElement( 'span' );
		lineText.className = 'steamdb_stats_name';
		lineText.textContent = _t( 'app_stats_followers' );
		grid.append( lineText );
		grid.append( followers );

		// Add to container
		container.insertBefore( block, container.firstChild );

		// Add responsive text heading
		const responsiveHeader = document.createElement( 'div' );
		responsiveHeader.className = 'responsive_block_header responsive_apppage_details_left';
		responsiveHeader.textContent = _t( 'app_stats_online' );
		container.insertBefore( responsiveHeader, container.firstChild );
	}

	let historyLink = null;
	let historyLinkResponsive = null;

	/** @type {Element[]} */
	const updateElements = [];

	if( items[ 'steamdb-last-update' ] )
	{
		const depotsUpdate = document.createElement( 'div' );
		depotsUpdate.className = 'dev_row steamdb_last_update';

		const subtitle = document.createElement( 'div' );
		subtitle.className = 'subtitle column';
		subtitle.textContent = _t( 'app_depots_update' );

		historyLink = document.createElement( 'a' );
		historyLink.className = 'date';
		historyLink.textContent = '…';
		historyLink.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/patchnotes/';

		depotsUpdate.appendChild( subtitle );
		depotsUpdate.appendChild( historyLink );
		updateElements.push( depotsUpdate );

		const releaseDate = document.querySelector( '.release_date' );

		if( releaseDate )
		{
			releaseDate.parentNode.insertBefore( depotsUpdate, releaseDate.nextSibling );
		}
		else
		{
			const firstDevRow = document.querySelector( '.glance_ctn_responsive_left .dev_row' );

			if( firstDevRow )
			{
				firstDevRow.parentNode.insertBefore( depotsUpdate, firstDevRow );
			}
		}

		// Responsive
		const responsiveGrid = document.getElementById( 'appHeaderGridContainer' );

		if( responsiveGrid )
		{
			const label = document.createElement( 'div' );
			label.className = 'grid_label grid_date';
			label.textContent = _t( 'app_depots_updated_short' );

			const content = document.createElement( 'div' );
			content.className = 'grid_content grid_date';

			historyLinkResponsive = document.createElement( 'a' );
			historyLinkResponsive.textContent = '…';
			historyLinkResponsive.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/patchnotes/';

			content.append( historyLinkResponsive );
			responsiveGrid.append( label );
			responsiveGrid.append( content );

			updateElements.push( label, content );
		}
	}

	SendMessageToBackgroundScript( {
		contentScriptQuery: 'GetApp',
		appid: GetCurrentAppID(),
	}, ( response ) =>
	{
		if( !response || !response.success )
		{
			if( response?.error )
			{
				WriteLog( `GetApp failed to load: ${response.error}` );
			}
			else
			{
				WriteLog( 'GetApp failed to load' );
			}

			for( const el of updateElements )
			{
				el.remove();
			}

			steamApiPlayersFetch.then( ( livePlayers ) =>
			{
				if( livePlayers < 1 )
				{
					block?.remove();
					return;
				}

				onlineNow.textContent = FormatNumber( livePlayers );
			} );

			return;
		}

		WriteLog( 'GetApp loaded' );

		if( items[ 'online-stats' ] && block !== null )
		{
			onlineNow.textContent = FormatNumber( response.data.cp );
			peakToday.textContent = FormatNumber( response.data.mdp );
			peakAll.textContent = FormatNumber( response.data.mp );

			if( response.data.f > 0 )
			{
				followers.textContent = FormatNumber( response.data.f );
			}
			else
			{
				followers.previousElementSibling.remove();
				followers.remove();
			}

			steamApiPlayersFetch.then( ( livePlayers ) =>
			{
				if( livePlayers < 1 )
				{
					return;
				}

				WriteLog( 'FetchSteamApiCurrentPlayers loaded' );

				onlineNow.textContent = FormatNumber( livePlayers );

				if( livePlayers > response.data.mdp )
				{
					peakToday.textContent = FormatNumber( livePlayers );
				}

				if( livePlayers > response.data.mp )
				{
					peakAll.textContent = FormatNumber( livePlayers );
				}
			} );
		}

		if( items[ 'steamdb-last-update' ] && response.data.u )
		{
			const dateFormatter = new Intl.DateTimeFormat( language, { dateStyle: 'medium' } );
			const actualDateText = dateFormatter.format( new Date( response.data.u * 1000 ) );
			const [ daysSinceLastUpdate, relativeText ] = FormatRelativeDate( response.data.u );

			const historyRelativeDate = document.createElement( 'span' );
			historyRelativeDate.textContent = `(${relativeText})`;

			if( daysSinceLastUpdate > 365 )
			{
				historyRelativeDate.className = 'steamdb_last_update_old';
			}

			historyLink.textContent = actualDateText + ' ';
			historyLink.append( historyRelativeDate );

			if( historyLinkResponsive !== null )
			{
				historyLinkResponsive.textContent = `${actualDateText} (${relativeText})`;
			}
		}
		else
		{
			for( const el of updateElements )
			{
				el.remove();
			}
		}
	} );
}

function FollowInvalidateCache()
{
	BindFollowClick( document.querySelector( '.queue_control_button.queue_btn_follow .queue_btn_inactive' ) );
	BindFollowClick( document.querySelector( '.queue_control_button.queue_btn_follow .queue_btn_active' ) );

	/**
	 * @param {Element} el
	 */
	function BindFollowClick( el )
	{
		if( !el )
		{
			return;
		}

		el.addEventListener( 'click', () =>
		{
			WriteLog( 'Invalidating userdata cache (follow button clicked)' );

			SendMessageToBackgroundScript( {
				contentScriptQuery: 'InvalidateCache',
			}, () =>
			{
				// noop
			} );
		} );
	}
}

function HideCurator()
{
	/** @type {HTMLElement} */
	const container = document.querySelector( '.referring_curator_ctn' );

	if( container )
	{
		/** @type {HTMLAnchorElement} */
		const referring = container.querySelector( '.referringSteamCurator a' );

		if( referring )
		{
			const url = new URL( referring.href );

			if( url.pathname.startsWith( '/curator/4777282' ) )
			{
				container.hidden = true;
			}
		}
	}
}

/**
 * @param {number} num
 */
function FormatNumber( num )
{
	return numberFormatter.format( num );
}

/**
 * @param {number} date
 * @returns {[number, string]}
 */
function FormatRelativeDate( date )
{
	const relativeDateFormatter = new Intl.RelativeTimeFormat( language, { numeric: 'auto' } );
	const dayInSeconds = 24 * 60 * 60;
	const daysSinceLastUpdate = Math.floor( ( ( Date.now() / 1000 ) - date ) / dayInSeconds );

	if( daysSinceLastUpdate > 30 )
	{
		return [ daysSinceLastUpdate, relativeDateFormatter.format( -Math.round( daysSinceLastUpdate / 30 ), 'month' ) ];
	}

	return [ daysSinceLastUpdate, relativeDateFormatter.format( -daysSinceLastUpdate, 'day' ) ];
}


/**
 * @param {Element} element
 * @param {string} type
 * @param {number} id
 */
function InsertPurchaseBlockId( element, type, id )
{
	if( !element )
	{
		WriteLog( 'Tried to insert purchase block for non existing element', type, id );
		return;
	}

	const span = document.createElement( 'span' );
	span.dataset.tooltipText = _t( 'view_on_steamdb' );

	const hash = document.createElement( 'span' );
	hash.style.fontWeight = 'bold';
	hash.textContent = '# ';
	span.append( hash );

	const text = document.createElement( 'span' );
	text.className = 'steamdb_link_id';
	text.textContent = id.toString();
	span.append( text );

	const link = document.createElement( 'a' );
	link.className = 'btn_black btn_tiny steamdb_link';
	link.append( span );

	if( id < 1 )
	{
		link.href = '#';
		link.hidden = true;

		element.insertBefore( link, element.querySelector( '.game_area_purchase_game_dropdown_right_panel' ) );
	}
	else
	{
		link.href = `${GetHomepage()}${type}/${id}/`;
		element.prepend( link );
	}
}

/**
 * @param {{ [key: string]: any }} options
 */
function AddCollapseButtonToAlreadyInLibraryBlock( options )
{
	/** @type {HTMLElement} */
	const alreadyInLibrary = document.querySelector( '.game_area_already_owned .already_in_library' );

	/** @type {HTMLElement} */
	const playStats = document.querySelector( '.game_area_play_stats' );

	if( !alreadyInLibrary || !playStats )
	{
		return;
	}

	const isCollapsed = !!options[ 'collapse-already-in-library' ];

	if( isCollapsed )
	{
		playStats.hidden = true;
	}

	const link = document.createElement( 'a' );
	link.classList.add( 'steamdb_already_in_library_link' );
	const steamProtocol = window.location.hostname === 'store.steamchina.com' ? 'steamchina' : 'steam';
	link.href = `${steamProtocol}://nav/games/details/${GetCurrentAppID()}`;
	link.textContent = alreadyInLibrary.textContent;
	alreadyInLibrary.replaceChildren( link );

	const arrow = document.createElement( 'div' );
	arrow.className = 'graph_toggle_icon';
	arrow.classList.add( isCollapsed ? 'down' : 'up' );
	arrow.append( document.createTextNode( ' ' ) );

	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'steamdb_already_in_library_collapse';
	button.append( arrow );

	button.addEventListener( 'click', ( e ) =>
	{
		e.preventDefault();

		const hidden = !playStats.hidden;

		playStats.hidden = hidden;

		arrow.classList.toggle( 'down', hidden );
		arrow.classList.toggle( 'up', !hidden );

		SetOption( 'collapse-already-in-library', hidden );
	} );

	alreadyInLibrary.insertAdjacentElement( 'afterend', button );
	alreadyInLibrary.style.marginRight = `${button.getBoundingClientRect().width - 15}px`;
}

function MakeGameInFamilyLinkToLibrary()
{
	const inFamilyText = document.querySelector( '.game_purchase_area_owned_by_family .family_info p' );

	if( !inFamilyText )
	{
		return;
	}

	const link = document.createElement( 'a' );
	link.classList.add( 'steamdb_already_in_library_link' );
	const steamProtocol = window.location.hostname === 'store.steamchina.com' ? 'steamchina' : 'steam';
	link.href = `${steamProtocol}://nav/games/details/${GetCurrentAppID()}`;
	link.textContent = inFamilyText.textContent;
	inFamilyText.replaceChildren( link );
}

function AddLinksToDevelopers()
{
	/** @type {Element[]} */
	const rows = [];

	/** @type {Element} */
	let row = document.querySelector( '#developers_list' )?.parentElement;
	if( row )
	{
		rows.push( row );
	}

	// Next row is publisher, but it has no id we can use.
	row = row?.nextElementSibling;
	if( row )
	{
		rows.push( row );
	}

	for( const row of rows )
	{
		const container = row.querySelector( '.summary.column' );

		if( !container )
		{
			continue;
		}

		const isDeveloper = container.id === 'developers_list';
		const type = isDeveloper ? 'developer' : 'publisher';
		const links = container.querySelectorAll( 'a' );

		for( const originalLink of links )
		{
			if( originalLink.origin !== location.origin ) // Skip external links that could be added by other extensions
			{
				continue;
			}

			if( originalLink.parentElement?.classList.contains( 'as-homepage' ) ) // Skip "homepage" links added by Augmented Steam
			{
				continue;
			}

			const name = originalLink.textContent.trim();
			if( !name )
			{
				continue;
			}

			const link = document.createElement( 'a' );
			link.className = 'steamdb_dev_pub_link';
			link.href = `${GetHomepage()}${type}/${encodeURIComponent( name )}/`;

			const icon = document.createElement( 'img' );
			icon.src = GetLocalResource( 'icons/white.svg' );
			icon.dataset.tooltipText = _t( 'view_on_steamdb' );
			link.appendChild( icon );

			originalLink.insertAdjacentElement( 'afterend', link );
		}

		container.parentElement.classList.add( 'steamdb_dev_pub_link_container' );
	}

	// In case adding buttons causes the row to overflow, we have to ensure Steam's "plus" button gets shown
	const script = document.createElement( 'script' );
	script.id = 'steamdb_collapse_dev_pub_links';
	script.type = 'text/javascript';
	script.src = GetLocalResource( 'scripts/store/app_collapse_long_strings.js' );
	script.dataset.homepage = GetHomepage();

	document.head.appendChild( script );
}
