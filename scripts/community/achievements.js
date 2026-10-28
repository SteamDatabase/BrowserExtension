/* exported DoAchievements */
'use strict';

/**
 * Achievements page enhancement for Steam's NEW (React) achievements page.
 *
 * Why this differs from the old version:
 *  - The new page has no .achieveRow / #personalAchieve / #tabs / #application_config,
 *    and class names are hashed, so scraping DOM rows is not reliable.
 *  - The new list is virtualized (only visible rows exist in the DOM).
 *  - But the server-rendered HTML contains the full data (schema, user unlocks,
 *    global percentages, config) in <script id="valve-ssr-data">. The page's own script
 *    removes that tag after boot, so we re-fetch the page HTML and read it from there.
 *
 * @typedef {object} Ach
 * @property {number} id
 * @property {string} apiName
 * @property {string} name
 * @property {string} desc
 * @property {boolean} hidden
 * @property {string} iconAchieved
 * @property {string} iconUnachieved
 * @property {number} globalUnlock  0..1
 * @property {boolean} unlocked
 * @property {number} unlockTimestamp  ms, 0 if locked
 * @property {number} group  index in groups
 *
 * @typedef {object} Group
 * @property {string} [name]
 * @property {string} [dlcAppName]
 * @property {number} [dlcAppId]
 * @property {number} [logoAppId]
 * @property {string[]} achievementApiNames
 * @property {Ach[]} [list]
 * @property {number} [earned]
 * @property {HTMLDetailsElement} [unlockedEl]
 * @property {HTMLDetailsElement} [lockedEl]
 * @property {HTMLElement} [globalEl]
 */

/**
 * @param {boolean} isPersonal  hint from the caller; real value is derived from the data
 */
function DoAchievements( isPersonal )
{
	WriteLog( 'achievements.js (React rewrite) loaded', location.pathname );

	GetOption( {
		'improve-achievements': true,
		'spoiler-achievements': true,
		'achievements-group-updates': true,
		'achievements-global-unlock': true,
	}, ( items ) =>
	{
		InitAchievements( items, isPersonal ).catch( ( e ) => console.error( '[SteamDB]', e ) );
	} );
}

/**
 * @param {string} selector
 * @param {(el: Element) => boolean} [predicate]
 * @param {number} timeout
 * @returns {Promise<Element|null>}
 */
function WaitForElement( selector, predicate = () => true, timeout = 15000 )
{
	return new Promise( ( resolve ) =>
	{
		const check = () =>
		{
			const el = document.querySelector( selector );
			return el && predicate( el ) ? el : null;
		};

		const found = check();

		if( found )
		{
			resolve( found );
			return;
		}

		const observer = new MutationObserver( () =>
		{
			const el = check();

			if( el )
			{
				observer.disconnect();
				resolve( el );
			}
		} );

		observer.observe( document.documentElement, { childList: true, subtree: true } );

		setTimeout( () =>
		{
			observer.disconnect();
			resolve( null );
		}, timeout );
	} );
}

/**
 * Read all data we need from the SSR payload of this very page.
 * @param {number} appid
 */
async function LoadPageData( appid )
{
	const response = await fetch( location.href, { headers: { Accept: 'text/html' } } );
	const html = await response.text();
	const doc = new DOMParser().parseFromString( html, 'text/html' );
	const dataElement = doc.getElementById( 'valve-ssr-data' );

	if( !dataElement )
	{
		throw new Error( 'valve-ssr-data not found' );
	}

	const ssr = JSON.parse( dataElement.textContent );
	const queries = JSON.parse( ssr.renderContext.queryData ).queries;

	const find = ( kind ) => queries.find( ( q ) =>
		q.queryKey[ 0 ] === 'achievements' && q.queryKey[ 1 ] === appid && q.queryKey[ 2 ] === kind
	)?.state?.data;

	/** @type {ApplicationConfig} */
	const config = Object.assign( {}, ssr.Config );

	try
	{
		const token = JSON.parse( ssr.loaderData[ 0 ] ).strWebAPIToken;

		if( token )
		{
			config.WEBAPI_ACCESS_TOKEN = token;
		}
	}
	catch
	{
		// not logged in, no token
	}

	return {
		config,
		schema: find( 'schema_v2' ),
		user: find( 'user_achievements' ),
		percentages: find( 'globalpercentages' )?.percentages || {},
	};
}

/**
 * @param {{ [key: string]: any }} items
 * @param {boolean} isPersonalHint
 */
async function InitAchievements( items, isPersonalHint )
{
	if( !items[ 'improve-achievements' ] )
	{
		return;
	}

	const spoilerAchievements = !!items[ 'spoiler-achievements' ];
	const showGlobalUnlock = !!items[ 'achievements-global-unlock' ];

	const appidMatch = location.pathname.match( /\/achievements\/(?<id>[0-9]+)/ );

	if( !appidMatch )
	{
		WriteLog( 'Failed to find appid' );
		return;
	}

	const appid = Number.parseInt( appidMatch.groups.id, 10 );

	// Wait for React to render the virtualized list so we know where to put our container
	const firstRow = await WaitForElement( '[data-tableindex]' );

	if( !firstRow )
	{
		WriteLog( 'Failed to find new achievements list' );
		return;
	}

	// The virtualized list wrapper: plain (non-hashed) "Panel" class + position: relative
	/** @type {HTMLElement|null} */
	let nativeList = firstRow.parentElement;

	while( nativeList && !( nativeList.classList.contains( 'Panel' ) && nativeList.style.position === 'relative' ) )
	{
		nativeList = nativeList.parentElement;
	}

	if( !nativeList )
	{
		WriteLog( 'Failed to find native list wrapper' );
		return;
	}

	WriteLog( 'Found native list, loading page data' );

	const data = await LoadPageData( appid );

	if( !data.schema || !data.schema.groups )
	{
		WriteLog( 'Failed to find achievement schema' );
		return;
	}

	// Steam now has its own "sets" (base game, DLC, ...). When a game uses them, Steam's page already
	// groups achievements and all its own features (compare, filters, global stats) work, so leave it alone.
	const nativeSets = data.schema.groups.filter( ( g ) => g.id !== 0 && g.achievements.length > 0 );

	if( nativeSets.length > 0 )
	{
		WriteLog( 'Steam already groups this game into sets, not changing the page' );
		return;
	}

	const applicationConfig = data.config;
	const isPersonal = !!data.user || ( isPersonalHint && /^\/(?:id|profiles)\//.test( location.pathname ) );
	const userAchievements = data.user?.achievements || {};

	const baseName = document.title.match( /^Steam Community :: (?<name>.+?) :: /u )?.groups.name || 'Base Game';

	// Group updates from SteamDB (DLC / updates), if enabled
	/** @type {Group[]|null} */
	const steamdbGroups = await new Promise( ( resolve ) =>
	{
		if( !items[ 'achievements-group-updates' ] )
		{
			resolve( null );
			return;
		}

		SendMessageToBackgroundScript( {
			contentScriptQuery: 'GetAchievementsGroups',
			appid,
		}, ( response ) =>
		{
			if( !response || !response.success || !Array.isArray( response.data ) )
			{
				WriteLog( 'GetAchievementsGroups failed to load', response?.error );
				resolve( null );
				return;
			}

			WriteLog( 'GetAchievementsGroups loaded' );
			resolve( response.data );
		} );
	} );

	/** @type {Group[]} */
	let groups;

	if( steamdbGroups )
	{
		groups = [ { name: baseName, achievementApiNames: [] }, ...steamdbGroups ];
	}
	else
	{
		// Fall back to the groups already present in Steam's own schema (DLC achievements)
		groups = [ { name: baseName, achievementApiNames: [] } ];

		for( const schemaGroup of data.schema.groups )
		{
			if( schemaGroup.id === 0 || !schemaGroup.dlcappid )
			{
				continue;
			}

			groups.push( {
				name: schemaGroup.name || undefined,
				dlcAppId: schemaGroup.dlcappid,
				achievementApiNames: schemaGroup.achievements.map( ( a ) => a.api_name ),
			} );
		}
	}

	/** @type {Map<string, number>} */
	const apiNameToGroup = new Map();

	groups.forEach( ( group, index ) =>
	{
		group.list = [];
		group.earned = 0;

		for( const apiName of group.achievementApiNames )
		{
			apiNameToGroup.set( apiName, index );
		}
	} );

	// Build achievement list from the schema
	for( const schemaGroup of data.schema.groups )
	{
		for( const a of schemaGroup.achievements )
		{
			const user = userAchievements[ a.internal_key ];
			const unlocked = !!user?.unlocked;

			/** @type {Ach} */
			const ach = {
				id: a.internal_key,
				apiName: a.api_name,
				name: a.name,
				desc: a.description,
				hidden: !!a.hidden,
				iconAchieved: a.icon_achieved,
				iconUnachieved: a.icon_unachieved,
				globalUnlock: ( data.percentages[ a.internal_key ] || 0 ) / 100,
				unlocked,
				unlockTimestamp: unlocked ? ( user.unlock_time || 0 ) * 1000 : 0,
				group: apiNameToGroup.get( a.api_name ) || 0,
			};

			groups[ ach.group ].list.push( ach );

			if( unlocked )
			{
				groups[ ach.group ].earned++;
			}
		}
	}

	WriteLog( 'Groups:', groups.map( ( g ) => `${g.name || g.dlcAppName || g.dlcAppId} (${g.list.length})` ) );

	/** @type {Map<number, Ach>} */
	const achById = new Map();

	for( const group of groups )
	{
		for( const ach of group.list )
		{
			achById.set( ach.id, ach );
		}
	}

	const mediaCdn = applicationConfig.MEDIA_CDN_COMMUNITY_URL ||
		document.querySelector( 'img[src*="/images/apps/"]' )?.src.replace( /images\/apps\/.*$/u, '' ) ||
		'https://shared.fastly.steamstatic.com/community_assets/';
	const storeItemBase = applicationConfig.STORE_ITEM_BASE_URL || 'https://shared.fastly.steamstatic.com/store_item_assets/';
	const baseCapsuleUrl = `${storeItemBase}steam/apps/${appid}/header.jpg`;

	const dlcCapsulesPromise = FetchDlcCapsules( applicationConfig, appid, groups );

	const percentFormatter = new Intl.NumberFormat( GetLanguage(), {
		style: 'percent',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	} );

	const dateFormatter = new Intl.DateTimeFormat( GetLanguage(), {
		dateStyle: 'medium',
		timeStyle: 'short',
	} );

	let sortByTime = false;

	/**
	 * @param {Ach} ach
	 */
	const CreateAchievementRow = ( ach ) =>
	{
		const element = document.createElement( 'div' );
		element.className = 'steamdb_achievement';
		element.dataset.achId = ach.id.toString();

		if( ach.id < 100 )
		{
			element.style.viewTransitionName = `steamdb-achievement-${ach.id}`;
		}

		const showColor = !isPersonal || ach.unlocked || !ach.iconUnachieved;

		const image = document.createElement( 'img' );
		image.src = `${mediaCdn}images/apps/${appid}/${showColor ? ach.iconAchieved : ach.iconUnachieved}`;
		image.className = 'steamdb_achievement_image';
		image.loading = 'lazy';
		element.append( image );

		const nameContainer = document.createElement( 'div' );
		element.append( nameContainer );

		const name = document.createElement( 'h3' );
		name.textContent = ach.name;
		nameContainer.append( name );

		if( ach.hidden && !ach.unlocked )
		{
			const hiddenAch = document.createElement( 'i' );
			hiddenAch.textContent = _t( 'hidden_achievement' );

			const desc = document.createElement( 'span' );
			desc.textContent = ach.desc;

			const descSpoiler = document.createElement( 'h5' );
			descSpoiler.append( hiddenAch );
			descSpoiler.append( desc );
			nameContainer.append( descSpoiler );

			if( spoilerAchievements )
			{
				desc.classList.add( 'steamdb_achievement_spoiler' );

				if( isPersonal )
				{
					image.classList.add( 'steamdb_achievement_spoiler' );
					name.classList.add( 'steamdb_achievement_spoiler' );
				}
			}
		}
		else
		{
			const desc = document.createElement( 'h5' );
			desc.textContent = ach.desc;
			nameContainer.append( desc );
		}

		// Global unlock percentage on the far right, shown/hidden by the "Show Global Stats" toggle
		const AppendGlobalUnlock = () =>
		{
			const percent = percentFormatter.format( ach.globalUnlock );

			const unlock = document.createElement( 'div' );
			unlock.className = 'steamdb_achievement_unlock_global';

			// Rare achievements (under 10% of players) get a gold percentage
			if( ach.globalUnlock < 0.1 )
			{
				unlock.classList.add( 'steamdb_achievement_unlock_global_rare' );
			}

			unlock.title = _t( 'achievement_global_unlock', [ percent ] );
			unlock.textContent = percent;
			element.append( unlock );
		};

		if( !isPersonal )
		{
			AppendGlobalUnlock();

			return element;
		}

		if( ach.globalUnlock < 0.1 )
		{
			image.classList.add( 'steamdb_achievement_image_glow' );
		}

		const status = document.createElement( 'div' );
		status.className = 'steamdb_achievement_status';

		if( ach.unlocked )
		{
			const unlockRow = document.createElement( 'div' );
			unlockRow.className = 'steamdb_achievement_status_row';

			const text = document.createElement( 'div' );

			if( ach.unlockTimestamp )
			{
				text.textContent = dateFormatter.format( ach.unlockTimestamp );

				const relativeUnlock = document.createElement( 'div' );
				relativeUnlock.textContent = FormatRelativeTime( Date.now() - ach.unlockTimestamp );
				text.append( relativeUnlock );
			}
			else
			{
				text.textContent = '—';
			}

			unlockRow.append( text );
			status.append( unlockRow );
		}

		element.append( status );

		AppendGlobalUnlock();

		return element;
	};

	/**
	 * @param {number} earned
	 * @param {number} total
	 */
	const CreateProgressSummary = ( earned, total ) =>
	{
		const percentage = total > 0 ? earned / total : 0;
		const progress = document.createElement( 'div' );
		progress.className = 'steamdb_achievement_progress';

		const info = document.createElement( 'div' );
		info.className = 'steamdb_achievement_progress_info';
		info.textContent = `${earned} / ${total} (${percentFormatter.format( percentage )})`;

		const progressBar = document.createElement( 'div' );
		progressBar.className = 'steamdb_achievement_progressbar';

		const progressBarInner = document.createElement( 'div' );
		progressBarInner.className = 'steamdb_achievement_progressbar_inner';
		progressBarInner.style.width = Math.round( percentage * 100 ) + '%';
		progressBar.append( progressBarInner );

		info.append( progressBar );
		progress.append( info );

		return progress;
	};

	/**
	 * @param {Ach[]} list
	 */
	const SortByGlobal = ( list ) => list.sort( ( a, b ) =>
	{
		if( a.globalUnlock === b.globalUnlock )
		{
			return a.id - b.id;
		}

		return b.globalUnlock > a.globalUnlock ? 1 : -1;
	} );

	/**
	 * (Re)fill the achievement rows of a group.
	 * @param {Group} group
	 */
	const FillGroup = ( group ) =>
	{
		const clear = ( /** @type {HTMLElement} */ el ) =>
		{
			while( el.lastElementChild && el.lastElementChild.tagName !== 'SUMMARY' )
			{
				el.lastElementChild.remove();
			}
		};

		if( !isPersonal )
		{
			clear( group.globalEl );

			for( const ach of SortByGlobal( group.list.slice() ) )
			{
				group.globalEl.append( CreateAchievementRow( ach ) );
			}

			return;
		}

		clear( group.unlockedEl );
		clear( group.lockedEl );

		const unlocked = group.list.filter( ( a ) => a.unlocked );
		const locked = group.list.filter( ( a ) => !a.unlocked );

		SortByGlobal( locked );

		if( sortByTime )
		{
			unlocked.sort( ( a, b ) => a.unlockTimestamp === b.unlockTimestamp ?
				a.id - b.id :
				b.unlockTimestamp - a.unlockTimestamp );
		}
		else
		{
			SortByGlobal( unlocked );
		}

		for( const ach of unlocked )
		{
			group.unlockedEl.append( CreateAchievementRow( ach ) );
		}

		for( const ach of locked )
		{
			group.lockedEl.append( CreateAchievementRow( ach ) );
		}

		group.unlockedEl.hidden = unlocked.length === 0;
		group.lockedEl.hidden = locked.length === 0;
	};

	// ---- Build container ----
	let counter = 0;
	const newContainer = document.createElement( 'div' );
	newContainer.className = 'steamdb_achievements_container';

	// Toolbar (replaces the old tab bar)
	const extraTabs = document.createElement( 'div' );
	extraTabs.className = 'steamdb_stats_extra_tabs';

	/** @type {HTMLButtonElement|null} */
	let sortButton = null;

	if( isPersonal )
	{
		sortButton = document.createElement( 'button' );
		sortButton.type = 'button';
		sortButton.className = 'btn_grey_black btn_small_thin steamdb_achievements_sort_button';

		const sortButtonText = document.createElement( 'span' );
		sortButtonText.textContent = _t( 'achievements_sort_by_time' );
		sortButton.append( sortButtonText );
		extraTabs.append( sortButton );

		sortButton.addEventListener( 'click', ( e ) =>
		{
			e.preventDefault();

			sortByTime = !sortByTime;
			sortButton.classList.toggle( 'steamdb_active', sortByTime );

			StartViewTransition( () =>
			{
				for( const group of groups )
				{
					if( group.unlockedEl )
					{
						FillGroup( group );
					}
				}

				ApplyFilters( false );
			} );
		} );
	}

	const steamID = location.pathname.match( /^\/(?<url>(?:id|profiles)\/(?:[^\s/]+))\/?/ );

	{
		const link = document.createElement( 'a' );
		link.dataset.tooltipText = _t( 'view_on_steam_hunters' );
		link.href = steamID && isPersonal ?
			`https://steamhunters.com/${steamID.groups.url}/apps/${appid}/achievements?utm_source=SteamDB` :
			`https://steamhunters.com/apps/${appid}/achievements?utm_source=SteamDB`;

		const image = document.createElement( 'img' );
		image.className = 'steamdb_stats_tab_icon';
		image.src = GetLocalResource( 'icons/steamhunters.svg' );
		link.append( image );
		extraTabs.append( link );
	}

	{
		const link = document.createElement( 'a' );
		link.href = `${GetHomepage()}app/${appid}/stats/`;
		link.dataset.tooltipText = _t( 'view_on_steamdb' );

		const image = document.createElement( 'img' );
		image.className = 'steamdb_stats_tab_icon';
		image.src = GetLocalResource( 'icons/white.svg' );
		link.append( image );
		extraTabs.append( link );
	}

	if( !isPersonal )
	{
		extraTabs.append( CreateHideEarnedButton() );
	}

	extraTabs.append( CreateFoldButton( true ) );

	// "Show Global Stats" toggle, like Steam's own page
	const globalStatsKey = 'steamdb_ach_global_stats';
	const storedGlobalStats = SessionStorageGet( globalStatsKey );
	const globalStatsOn = storedGlobalStats === null ? ( !isPersonal || showGlobalUnlock ) : storedGlobalStats === '1';

	newContainer.classList.toggle( 'steamdb_hide_global_stats', !globalStatsOn );

	const toggleLabel = document.createElement( 'label' );
	toggleLabel.className = 'steamdb_toggle';

	const toggleInput = document.createElement( 'input' );
	toggleInput.type = 'checkbox';
	toggleInput.checked = globalStatsOn;
	toggleInput.setAttribute( 'role', 'switch' );

	const toggleTrack = document.createElement( 'span' );
	toggleTrack.className = 'steamdb_toggle_track';

	const toggleText = document.createElement( 'span' );
	toggleText.textContent = _t( 'achievements_show_global_stats' ) || 'Show Global Stats';

	toggleLabel.append( toggleInput, toggleTrack, toggleText );

	toggleInput.addEventListener( 'change', () =>
	{
		SessionStorageSet( globalStatsKey, toggleInput.checked ? '1' : '0' );
		newContainer.classList.toggle( 'steamdb_hide_global_stats', !toggleInput.checked );
	} );

	// Search
	const searchField = document.createElement( 'input' );
	searchField.name = 'achievements-search';
	searchField.maxLength = 255;
	searchField.type = 'search';
	searchField.placeholder = _t( 'search' );
	searchField.setAttribute( 'accesskey', '/' );

	const searchFieldContainer = document.createElement( 'div' );
	searchFieldContainer.className = 'steamdb_achievement_search';
	searchFieldContainer.append( searchField );

	const toolbar = document.createElement( 'div' );
	toolbar.className = 'steamdb_achievements_toolbar';
	toolbar.append( toggleLabel, extraTabs, searchFieldContainer );
	newContainer.append( toolbar );

	// Filters: achievement state, set (group) and search text
	/** @type {HTMLSelectElement|null} */
	let stateSelect = null;

	/** @type {HTMLSelectElement|null} */
	let setSelect = null;

	const filterableGroups = groups.map( ( group, index ) => ( { group, index } ) ).filter( ( g ) => g.group.list.length > 0 );

	const CreateSelect = ( /** @type {string} */ label ) =>
	{
		const select = document.createElement( 'select' );
		select.className = 'steamdb_achievements_select';
		select.setAttribute( 'aria-label', label );

		return select;
	};

	if( isPersonal )
	{
		stateSelect = CreateSelect( 'Filter' );

		for( const [ value, text ] of [
			[ 'all', _t( 'achievements_filter_all' ) || 'All Achievements' ],
			[ 'unlocked', _t( 'achievements_filter_unlocked' ) || 'Unlocked' ],
			[ 'locked', _t( 'achievements_filter_locked' ) || 'Locked' ],
		] )
		{
			stateSelect.append( new Option( text, value ) );
		}

		toolbar.insertBefore( stateSelect, searchFieldContainer );
	}

	if( filterableGroups.length > 1 )
	{
		setSelect = CreateSelect( 'Set' );
		setSelect.append( new Option( _t( 'achievements_sets_all', [ filterableGroups.length.toString() ] ) || `All Sets (${filterableGroups.length})`, 'all' ) );

		for( const { group, index } of filterableGroups )
		{
			setSelect.append( new Option( group.dlcAppName || group.name || 'Update', index.toString() ) );
		}

		toolbar.insertBefore( setSelect, searchFieldContainer );
	}

	const ApplyFilters = ( animate = true ) =>
	{
		const searchVal = searchField.value.trim().toUpperCase();
		const state = stateSelect ? stateSelect.value : 'all';
		const set = setSelect ? setSelect.value : 'all';

		/** @type {NodeListOf<HTMLElement>} */
		const achievementGroups = newContainer.querySelectorAll( '.steamdb_achievements_group' );

		const apply = () =>
		{
			for( const group of achievementGroups )
			{
				let count = 0;

				/** @type {NodeListOf<HTMLElement>} */
				const achievementElements = group.querySelectorAll( '.steamdb_achievement' );
				const inSet = set === 'all' || group.dataset.groupIndex === set;

				for( const achievement of achievementElements )
				{
					const ach = achById.get( Number.parseInt( achievement.dataset.achId, 10 ) );
					const title = achievement.querySelector( 'h3' ).textContent;
					const description = achievement.querySelector( 'h5' ).textContent;

					const found = inSet &&
						( state === 'all' || !ach || ( state === 'unlocked' ? ach.unlocked : !ach.unlocked ) ) &&
						( searchVal.length === 0 ||
							title.toUpperCase().includes( searchVal ) ||
							description.toUpperCase().includes( searchVal ) );

					achievement.hidden = !found;

					if( found )
					{
						count++;
					}
				}

				// Hide the earned/locked sections that have nothing to show with the current filters
				for( const list of group.querySelectorAll( '.steamdb_achievements_list' ) )
				{
					/** @type {HTMLElement} */ ( list ).hidden = !list.querySelector( '.steamdb_achievement:not([hidden])' );
				}

				group.hidden = count === 0;
			}
		};

		if( animate === false )
		{
			apply();
		}
		else
		{
			StartViewTransition( apply );
		}
	};

	searchField.addEventListener( 'input', () => ApplyFilters() );
	stateSelect?.addEventListener( 'change', () => ApplyFilters() );
	setSelect?.addEventListener( 'change', () => ApplyFilters() );

	document.addEventListener( 'keydown', ( e ) =>
	{
		if( e.ctrlKey || e.metaKey )
		{
			return;
		}

		if( e.target instanceof Element && [ 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON' ].includes( e.target.tagName ) )
		{
			return;
		}

		if( e.code === 'Slash' || e.code === 'KeyS' || e.key === '/' || e.key === 's' )
		{
			e.preventDefault();
			searchField.focus();
		}
	} );

	// One block per game / update
	for( let groupId = 0; groupId < groups.length; groupId++ )
	{
		const group = groups[ groupId ];

		if( group.list.length === 0 )
		{
			continue;
		}

		const gameGroup = document.createElement( 'div' );
		gameGroup.className = 'steamdb_achievements_group';
		gameGroup.dataset.groupIndex = groupId.toString();
		newContainer.append( gameGroup );

		{
			const summary = document.createElement( 'div' );
			summary.className = 'steamdb_achievements_title';
			gameGroup.append( summary );

			const dlcAppId = group.dlcAppId || appid;
			const logoAppId = group.logoAppId || dlcAppId;

			const summaryGameLogo = document.createElement( 'a' );
			summaryGameLogo.className = 'steamdb_achievements_game_logo_contain';
			summaryGameLogo.href = `https://store.steampowered.com/app/${dlcAppId}`;
			summary.append( summaryGameLogo );

			const summaryGameLogoImg = document.createElement( 'img' );
			summaryGameLogoImg.className = 'steamdb_achievements_game_logo';
			summaryGameLogoImg.src = baseCapsuleUrl;
			summaryGameLogo.append( summaryGameLogoImg );

			if( groupId === 0 )
			{
				summaryGameLogo.style.viewTransitionName = 'steamdb-gamelogo';
			}
			else if( logoAppId !== appid )
			{
				summaryGameLogoImg.dataset.appid = logoAppId.toString();
			}

			const summaryName = document.createElement( 'div' );
			summaryName.className = 'steamdb_achievements_game_name';
			summaryName.textContent = group.dlcAppName || group.name || 'Update';

			if( group.dlcAppName && group.name )
			{
				const summaryName2 = document.createElement( 'span' );
				summaryName2.className = 'steamdb_achievements_update_name';
				summaryName2.textContent = ` — ${group.name}`;
				summaryName.append( summaryName2 );
			}

			if( isPersonal && group.earned === group.list.length )
			{
				const completedImage = document.createElement( 'img' );
				completedImage.className = 'steamdb_completed_achievements_icon';
				completedImage.src = GetLocalResource( 'icons/achievements_completed.svg' );
				summaryGameLogo.append( completedImage );
			}

			const summaryText = document.createElement( 'div' );
			summaryText.className = 'steamdb_achievements_name_container';
			summaryText.append( summaryName );
			summary.append( summaryText );

			if( isPersonal )
			{
				summaryText.append( CreateProgressSummary( group.earned, group.list.length ) );
			}

			summary.append( CreateFoldButton() );
		}

		const panel = document.createElement( 'div' );
		panel.className = 'steamdb_achievements_panel';
		gameGroup.append( panel );

		if( isPersonal )
		{
			const unlockedEl = document.createElement( 'details' );
			const lockedEl = document.createElement( 'details' );

			unlockedEl.id = `steamdb_ach_details_${appid}_${counter++}`;
			lockedEl.id = `steamdb_ach_details_${appid}_${counter++}`;

			unlockedEl.addEventListener( 'toggle', OnToggleDetails );
			lockedEl.addEventListener( 'toggle', OnToggleDetails );

			const unlockedSummary = document.createElement( 'summary' );
			unlockedSummary.textContent = _t( 'achievements_unlocked_count', [ group.earned.toString() ] );
			unlockedEl.className = 'steamdb_achievements_list';
			unlockedEl.open = !IsSessionStorageSet( unlockedEl.id );
			unlockedEl.append( unlockedSummary );

			const lockedSummary = document.createElement( 'summary' );
			lockedSummary.textContent = _t( 'achievements_locked_count', [ ( group.list.length - group.earned ).toString() ] );
			lockedEl.className = 'steamdb_achievements_list';
			lockedEl.open = !IsSessionStorageSet( lockedEl.id );
			lockedEl.append( lockedSummary );

			group.unlockedEl = unlockedEl;
			group.lockedEl = lockedEl;

			panel.append( unlockedEl, lockedEl );
		}
		else
		{
			const globalEl = document.createElement( 'details' );
			globalEl.open = true;

			const globalSummary = document.createElement( 'summary' );
			globalSummary.textContent = _t( 'achievements_count', [ group.list.length.toString() ] ) || `ACHIEVEMENTS: ${group.list.length}`;
			globalEl.className = 'steamdb_achievements_list';
			globalEl.append( globalSummary );

			group.globalEl = globalEl;
			panel.append( globalEl );
		}

		FillGroup( group );
	}

	if( groups.filter( ( g ) => g.list.length > 0 ).length > 1 )
	{
		const disclaimer = document.createElement( 'div' );
		disclaimer.className = 'steamdb_achievement_groups_disclaimer';

		let image = document.createElement( 'img' );
		image.src = GetLocalResource( 'icons/white.svg' );
		disclaimer.append( image );

		disclaimer.append( document.createTextNode( ' × ' ) );

		image = document.createElement( 'img' );
		image.src = GetLocalResource( 'icons/steamhunters.svg' );
		disclaimer.append( image );

		const text = document.createElement( 'a' );
		text.href = `https://steamhunters.com/apps/${appid}/achievements?utm_source=SteamDB`;
		text.textContent = _t( 'achievements_groups_by_steamhunters' );
		disclaimer.append( text );

		newContainer.append( disclaimer );
	}

	// Steam's own filter bar ("Show Global Stats" switch, "All Achievements" dropdown and search box)
	// only controls its (now hidden) list, so hide it. Class names are hashed, so find the bar by
	// its switch role and hide the row that holds both the switch and the dropdown.
	const HideNativeFilterBar = () =>
	{
		for( const toggle of document.querySelectorAll( '[role="switch"]' ) )
		{
			if( newContainer.contains( toggle ) )
			{
				continue;
			}

			/** @type {HTMLElement|null} */
			let bar = toggle.parentElement;

			// Walk up to the first ancestor that also contains the dropdown, but don't go past the bar
			for( let depth = 0; bar && depth < 4 && !bar.querySelector( '[role="combobox"]' ); depth++ )
			{
				bar = bar.parentElement;
			}

			if( !bar || !bar.querySelector( '[role="combobox"]' ) || bar.querySelector( '[data-tableindex]' ) )
			{
				bar = toggle.parentElement;
			}

			if( bar && bar.style.getPropertyValue( 'display' ) !== 'none' )
			{
				bar.style.setProperty( 'display', 'none', 'important' );
			}
		}
	};

	// ---- Swap in our container, hide Steam's virtualized list ----
	StartViewTransition( () =>
	{
		nativeList.insertAdjacentElement( 'beforebegin', newContainer );

		// Use !important so React re-renders of the list don't bring it back
		nativeList.style.setProperty( 'display', 'none', 'important' );

		if( !isPersonal )
		{
			const container = document.getElementById( 'mainContents' ) || newContainer;
			container.classList.add( 'steamdb_global_achievements_page' );

			if( IsSessionStorageSet( 'steamdb_ach_hide_earned' ) )
			{
				container.classList.add( 'steamdb_hide_earned_achievements' );
			}
		}

		HideNativeFilterBar();

		// Augmented Steam's sorting can't work on our list
		document.querySelector( '.es-sortbox' )?.setAttribute( 'hidden', 'true' );

		WriteLog( 'Container inserted', newContainer.isConnected );
	} );

	// React may re-render and drop our container (or un-hide the native list), so put it back if so
	const reattach = () =>
	{
		HideNativeFilterBar();

		if( !nativeList.isConnected )
		{
			const newNative = document.querySelector( '[data-tableindex]' )?.closest( '.Panel[style*="position: relative"]' );

			if( !newNative )
			{
				return;
			}

			nativeList = /** @type {HTMLElement} */ ( newNative );
		}

		if( !newContainer.isConnected )
		{
			WriteLog( 'Container was removed, re-inserting' );
			nativeList.insertAdjacentElement( 'beforebegin', newContainer );
		}

		if( nativeList.style.getPropertyValue( 'display' ) !== 'none' )
		{
			nativeList.style.setProperty( 'display', 'none', 'important' );
		}
	};

	new MutationObserver( reattach ).observe( document.body, { childList: true, subtree: true, attributes: true, attributeFilter: [ 'style' ] } );

	dlcCapsulesPromise.then( ( images ) =>
	{
		for( const [ dlcAppId, url ] of images )
		{
			/** @type {NodeListOf<HTMLImageElement>} */
			const imageTags = newContainer.querySelectorAll( `.steamdb_achievements_game_logo[data-appid="${dlcAppId}"]` );

			for( const image of imageTags )
			{
				image.src = url;
			}
		}
	} ).catch( ( e ) => console.error( '[SteamDB]', e ) );
}

/**
 * @typedef {{WEBAPI_BASE_URL: string, WEBAPI_ACCESS_TOKEN?: string, MEDIA_CDN_COMMUNITY_URL?: string, STORE_ICON_BASE_URL?: string, LANGUAGE?: string, STORE_ITEM_BASE_URL?: string, COUNTRY?: string, EREALM?: string}} ApplicationConfig
 */

/**
 * @param {ApplicationConfig} applicationConfig
 * @param {number} appid
 * @param {Group[]} achievementUpdates
 * @returns {Promise<Map<number, string>>}
 */
async function FetchDlcCapsules( applicationConfig, appid, achievementUpdates )
{
	const dlcAppIds = [];

	/** @type {Set<number>} */
	const uniqueAppIds = new Set();

	/** @type {Map<number, string>} */
	const images = new Map();

	for( const update of achievementUpdates )
	{
		const dlcAppId = update.dlcAppId;
		const logoAppId = update.logoAppId || dlcAppId;

		if( logoAppId && logoAppId !== appid && !uniqueAppIds.has( logoAppId ) )
		{
			uniqueAppIds.add( logoAppId );

			const knownCapsule = SessionStorageGet( `steamdb_capsule_${logoAppId}` );

			if( knownCapsule )
			{
				images.set( logoAppId, knownCapsule );
				continue;
			}

			dlcAppIds.push( {
				appid: logoAppId
			} );
		}
	}

	if( dlcAppIds.length === 0 )
	{
		return images;
	}

	const request = {
		ids: dlcAppIds,
		context:
		{
			language: applicationConfig.LANGUAGE,
			country_code: applicationConfig.COUNTRY,
			steam_realm: applicationConfig.EREALM,
		},
		data_request:
		{
			include_assets: true
		}
	};

	const params = new URLSearchParams();
	params.set( 'origin', location.origin );
	params.set( 'format', 'json' );

	if( applicationConfig.WEBAPI_ACCESS_TOKEN )
	{
		params.set( 'access_token', applicationConfig.WEBAPI_ACCESS_TOKEN );
	}

	params.set( 'input_json', JSON.stringify( request ) );

	// Request header field x-requested-with is not allowed
	// by Access-Control-Allow-Headers in preflight response.
	params.set( 'x_requested_with', 'SteamDB' );

	const assetsToTry = [
		'small_capsule',
		'main_capsule',
		'header',
	];

	const itemsFetch = await fetch( `${applicationConfig.WEBAPI_BASE_URL}IStoreBrowseService/GetItems/v1/?${params.toString()}` );
	const response = await itemsFetch.json();

	if( !response || !response.response || !response.response.store_items )
	{
		return images;
	}

	for( const item of response.response.store_items )
	{
		if( !item.assets )
		{
			continue;
		}

		for( const assetKey of assetsToTry )
		{
			if( item.assets[ assetKey ] )
			{
				// eslint-disable-next-line no-template-curly-in-string
				const name = item.assets.asset_url_format.replace( '${FILENAME}', item.assets[ assetKey ] );
				const url = `${applicationConfig.STORE_ITEM_BASE_URL}${name}`;
				images.set( item.appid, url );

				SessionStorageSet( `steamdb_capsule_${item.appid}`, url );

				break;
			}
		}
	}

	WriteLog( 'Loaded', images.size, 'capsules' );

	return images;
}

const relativeDateFormatter = new Intl.RelativeTimeFormat( GetLanguage(), { numeric: 'auto' } );

/**
 * @param {number} ms
 */
function FormatRelativeTime( ms )
{
	const sec = ms / 1000;
	const min = Math.round( sec / 60 );
	const hr = Math.round( min / 60 );
	const day = Math.round( hr / 24 );
	const month = Math.round( day / 30 );
	const year = Math.round( month / 12 );

	if( min < 60 )
	{
		return relativeDateFormatter.format( -min, 'minute' );
	}
	else if( hr < 24 )
	{
		return relativeDateFormatter.format( -hr, 'hour' );
	}
	else if( day < 30 )
	{
		return relativeDateFormatter.format( -day, 'day' );
	}
	else if( month < 18 )
	{
		return relativeDateFormatter.format( -month, 'month' );
	}

	return relativeDateFormatter.format( -year, 'year' );
}

/**
 * @param {MouseEvent} e
 * @param {HTMLElement|null|undefined} parent
 */
function ToggleDetailsElements( e, parent )
{
	e.preventDefault();

	if( !parent )
	{
		return;
	}

	const elements = parent.querySelectorAll( 'details' );
	let state = true;

	// If at least one is open, we will close all of them
	for( const el of elements )
	{
		if( el.open )
		{
			state = false;
			break;
		}
	}

	for( const el of elements )
	{
		el.open = state;
	}
}

/**
 * @param {MouseEvent} e
 */
function OnToggleAllGamesClick( e )
{
	e.preventDefault();

	ToggleDetailsElements( e, document.querySelector( '.steamdb_achievements_container' ) );
}

/**
 * @this {HTMLButtonElement}
 * @param {MouseEvent} e
 */
function OnToggleGameClick( e )
{
	e.preventDefault();

	ToggleDetailsElements( e, this.closest( '.steamdb_achievements_group' ) );
}

/**
 * @param {boolean} isRoot
 */
function CreateFoldButton( isRoot = false )
{
	const btn = document.createElement( 'button' );
	btn.type = 'button';
	btn.className = 'steamdb_fold_button';
	btn.addEventListener( 'click', isRoot ? OnToggleAllGamesClick : OnToggleGameClick );

	// https://lucide.dev/icons/fold-vertical
	btn.innerHTML = `
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M12 22v-6"/>
		<path d="M12 8V2"/>
		<path d="M4 12H2"/>
		<path d="M10 12H8"/>
		<path d="M16 12h-2"/>
		<path d="M22 12h-2"/>
		<path d="m15 19-3-3-3 3"/>
		<path d="m15 5-3 3-3-3"/>
	</svg>`;

	return btn;
}

/**
 * @param {MouseEvent} e
 */
function OnToggleEarnedClick( e )
{
	e.preventDefault();

	const container = document.getElementById( 'mainContents' ) || document.querySelector( '.steamdb_global_achievements_page' );

	if( !container )
	{
		return;
	}

	const state = container.classList.contains( 'steamdb_hide_earned_achievements' );

	StartViewTransition( () =>
	{
		container.classList.toggle( 'steamdb_hide_earned_achievements', !state );
	} );

	SessionStorageToggle( 'steamdb_ach_hide_earned', state );
}

function CreateHideEarnedButton()
{
	const btn = document.createElement( 'button' );
	btn.type = 'button';
	btn.className = 'steamdb_done_button';
	btn.addEventListener( 'click', OnToggleEarnedClick );

	// https://lucide.dev/icons/check-check
	btn.innerHTML = `
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M18 6 7 17l-5-5"/>
			<path d="m22 10-7.5 7.5L13 16"/>
		</svg>
	`;

	return btn;
}

/**
 * @param {string} key
 */
function SessionStorageGet( key )
{
	try
	{
		return sessionStorage.getItem( key );
	}
	catch
	{
		return null;
	}
}

/**
 * @param {string} key
 */
function IsSessionStorageSet( key )
{
	return !!SessionStorageGet( key );
}

/**
 * @param {string} key
 * @param {string} value
 */
function SessionStorageSet( key, value )
{
	try
	{
		sessionStorage.setItem( key, value );
	}
	catch
	{
		//
	}
}

/**
 * @param {string} key
 * @param {boolean} state
 */
function SessionStorageToggle( key, state )
{
	try
	{
		if( state )
		{
			sessionStorage.removeItem( key );
		}
		else
		{
			sessionStorage.setItem( key, '1' );
		}
	}
	catch
	{
		//
	}
}

/**
 * @this {HTMLDetailsElement}
 */
function OnToggleDetails()
{
	SessionStorageToggle( this.id, this.open );
}

/**
 * @param {ViewTransitionUpdateCallback} callback
 */
function StartViewTransition( callback )
{
	if( document.startViewTransition )
	{
		document.startViewTransition( () =>
		{
			try
			{
				callback();
			}
			catch( e )
			{
				console.error( '[SteamDB]', e );
			}
		} );
	}
	else
	{
		callback();
	}
}