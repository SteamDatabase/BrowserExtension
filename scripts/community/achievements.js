/* exported DoAchievements */
'use strict';

/**
 * @typedef {object} ApiGameAchievement
 * @property {string} internal_name - The internal identifier for the achievement
 * @property {string} localized_name - The display name of the achievement
 * @property {string} localized_desc - The description of the achievement
 * @property {string} icon - The filename for the achievement icon
 * @property {string} icon_gray - The filename for the grayed-out achievement icon
 * @property {boolean} hidden - Whether the achievement is hidden from players until unlocked
 * @property {string} player_percent_unlocked - The percentage of players who have unlocked this achievement
 * @property {number?} global_unlock - The parsed float value of player_percent_unlocked
 */

/**
 * @typedef {object} PlayerAchievement
 * @property {string|null} unlock
 * @property {string|null} unlockCompare
 * @property {string|null} progressText
 * @property {string|null} progressTextCompare
 * @property {string|null} progressWidth
 * @property {number} [unlockTimestamp]
 */

/**
 * @typedef {object} AchievementData
 * @property {number} id
 * @property {number} domId
 * @property {number} update
 * @property {ApiGameAchievement} achievement
 * @property {PlayerAchievement} player
 */

/**
 * @typedef {object} AchievementGroup
 * @property {string} [name]
 * @property {string} [dlcAppName]
 * @property {number} [dlcAppId]
 * @property {number} [logoAppId]
 * @property {string[]} achievementApiNames
 * @property {number} [earned]
 * @property {number} [earnedCompare]
 * @property {AchievementData[]} [achievementData]
 * @property {HTMLElement|null} [earnedDetailsElement]
 */

/**
 * @param {boolean} isPersonal
 */
function DoAchievements( isPersonal )
{
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
 * @param {{ [key: string]: any }} items
 * @param {boolean} isPersonal
 */
async function InitAchievements( items, isPersonal )
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

	// Steam's page is a React app with a virtualized list, so wait for it to boot before we touch the DOM
	let nativeList = await WaitForNativeList();

	if( !nativeList )
	{
		WriteLog( 'Failed to find native achievements list' );
		return;
	}

	const pageData = await LoadPageData( appid );

	if( !pageData )
	{
		WriteLog( 'Failed to load page data' );
		return;
	}

	// Steam groups achievements into sets by itself, and its own filters keep working then
	if( pageData.hasNativeSets )
	{
		WriteLog( 'Steam already groups this game into sets' );
		return;
	}

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
	}

	// Steam Hunters link
	const steamID = location.pathname.match( /^\/(?<url>(?:id|profiles)\/(?:[^\s/]+))\/?/ );

	if( steamID || !isPersonal )
	{
		const link = document.createElement( 'a' );
		link.dataset.tooltipText = _t( 'view_on_steam_hunters' );

		if( steamID )
		{
			link.href = `https://steamhunters.com/${steamID.groups.url}/apps/${appid}/achievements?utm_source=SteamDB`;
		}
		else
		{
			link.href = `https://steamhunters.com/apps/${appid}/achievements?utm_source=SteamDB`;
		}

		const image = document.createElement( 'img' );
		image.className = 'steamdb_stats_tab_icon';
		image.src = GetLocalResource( 'icons/steamhunters.svg' );
		link.append( image );

		extraTabs.append( link );
	}

	// SteamDB link
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

	// shortcut: compare view is not supported on the new page, the code paths that use these are dead
	const isCompareView = false;

	/** @type {string|null} */
	const leftAvatarUrl = null;

	/** @type {string|null} */
	const rightAvatarUrl = null;

	const applicationConfig = pageData.config;
	if( !applicationConfig.LANGUAGE )
	{
		WriteLog( 'Failed to find language' );
		return;
	}

	const params = new URLSearchParams();
	params.set( 'origin', location.origin );
	params.set( 'format', 'json' );

	if( applicationConfig.WEBAPI_ACCESS_TOKEN )
	{
		params.set( 'access_token', applicationConfig.WEBAPI_ACCESS_TOKEN );
	}

	params.set( 'appid', appid.toString() );

	if( applicationConfig.LANGUAGE === 'sc_schinese' )
	{
		params.set( 'language', 'schinese' );
	}
	else
	{
		params.set( 'language', applicationConfig.LANGUAGE );
	}

	// Request header field x-requested-with is not allowed
	// by Access-Control-Allow-Headers in preflight response.
	params.set( 'x_requested_with', 'SteamDB' );

	const gameAchievementsFetch = fetch( `${applicationConfig.WEBAPI_BASE_URL}IPlayerService/GetGameAchievements/v1/?${params.toString()}` )
		.then( ( response ) => response.json() );

	if( items[ 'achievements-group-updates' ] )
	{
		SendMessageToBackgroundScript( {
			contentScriptQuery: 'GetAchievementsGroups',
			appid,
		}, ( response ) =>
		{
			if( !response || !response.success || !Array.isArray( response.data ) )
			{
				gameAchievementsFetch.then( ( gameAchievements ) =>
				{
					ProcessGameAchievements( gameAchievements, [] );
				} );

				if( response?.error )
				{
					WriteLog( `GetAchievementsGroups failed to load: ${response.error}` );
				}
				else
				{
					WriteLog( 'GetAchievementsGroups failed to load' );
				}

				return;
			}

			WriteLog( 'GetAchievementsGroups loaded' );

			const dlcCapsulesPromise = FetchDlcCapsules( applicationConfig, appid, response.data );

			gameAchievementsFetch.then( ( gameAchievements ) =>
			{
				ProcessGameAchievements( gameAchievements, response.data, dlcCapsulesPromise );
			} ).catch( ( e ) => console.error( '[SteamDB]', e ) );
		} );
	}
	else
	{
		gameAchievementsFetch.then( ( gameAchievements ) =>
		{
			ProcessGameAchievements( gameAchievements, [] );
		} ).catch( ( e ) => console.error( '[SteamDB]', e ) );
	}

	/**
	 * @param {Record<string, any>} response
	 * @param {AchievementGroup[]} achievementUpdates
	 * @param {Promise<Map<number, string>>} [dlcCapsulesPromise]
	 */
	function ProcessGameAchievements( response, achievementUpdates, dlcCapsulesPromise )
	{
		if( !response || !response.response || !response.response.achievements )
		{
			return;
		}

		achievementUpdates.unshift( {
			name: document.title.match( /^Steam Community :: (?<name>.+?) :: / )?.groups.name || 'Base Game',
			achievementApiNames: [],
		} );

		/** @type {Map<string, number>} */
		const achievementInternalIdToUpdate = new Map();

		for( let updateId = 0; updateId < achievementUpdates.length; updateId++ )
		{
			const update = achievementUpdates[ updateId ];
			update.earned = 0;
			update.earnedCompare = 0;
			update.achievementData = [];
			update.earnedDetailsElement = null;

			for( const achievement of update.achievementApiNames )
			{
				achievementInternalIdToUpdate.set( achievement, updateId );
			}
		}

		/** @type {NodeListOf<HTMLElement>} */
		const oldAchievementRows = document.querySelectorAll( '.achieveRow' );

		/**
		 * @param {number} id
		 * @param {number} domId
		 * @param {ApiGameAchievement} achievement
		 * @param {PlayerAchievement} player
		 */
		const AddAchievementData = ( id, domId, achievement, player ) =>
		{
			achievement.global_unlock = Number.parseFloat( achievement.player_percent_unlocked ) / 100.0;

			/** @type {AchievementData} */
			const ach = {
				id,
				domId,
				update: achievementInternalIdToUpdate.get( achievement.internal_name ) || 0,
				achievement,
				player,
			};

			const update = achievementUpdates[ ach.update ];
			update.achievementData.push( ach );

			if( ach.player.unlock )
			{
				update.earned++;
			}

			if( ach.player.unlockCompare )
			{
				update.earnedCompare++;
			}
		};

		const dateFormatter = new Intl.DateTimeFormat( GetLanguage(), {
			dateStyle: 'medium',
			timeStyle: 'short',
		} );

		for( const [ id, achievement ] of response.response.achievements.entries() )
		{
			const user = pageData.userAchievements[ pageData.internalKeys.get( achievement.internal_name ) ];
			const unlockTimestamp = user?.unlocked ? ( user.unlock_time || 0 ) * 1000 : 0;
			let unlock = null;

			if( user?.unlocked )
			{
				// The text is not displayed for non-personal pages
				unlock = isPersonal && unlockTimestamp ? dateFormatter.format( unlockTimestamp ) : '—';
			}

			AddAchievementData( id, null, achievement, {
				unlock,
				unlockCompare: null,
				progressText: null,
				progressTextCompare: null,
				progressWidth: null,
				unlockTimestamp,
			} );
		}

		const percentFormatter = new Intl.NumberFormat( GetLanguage(), {
			style: 'percent',
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		} );

		/**
		 * @param {string} unlock
		 * @param {number} unlockTimestamp
		 * @param {boolean} isLeftPlayer
		 */
		const CreateUnlockRow = ( unlock, unlockTimestamp, isLeftPlayer ) =>
		{
			const unlockRow = document.createElement( 'div' );
			unlockRow.className = 'steamdb_achievement_status_row';

			const text = document.createElement( 'div' );
			text.textContent = unlock;
			unlockRow.append( text );

			if( !isLeftPlayer )
			{
				text.className = 'steamdb_achievement_status_row_compare';
			}

			if( unlockTimestamp )
			{
				const relativeUnlock = document.createElement( 'div' );
				relativeUnlock.textContent = FormatRelativeTime(
					Date.now() - unlockTimestamp,
				);
				text.append( relativeUnlock );
			}

			if( isCompareView )
			{
				const avatar = document.createElement( 'img' );
				avatar.className = 'steamdb_achievement_status_avatar';
				avatar.src = isLeftPlayer ? leftAvatarUrl : rightAvatarUrl;
				unlockRow.append( avatar );
			}

			return unlockRow;
		};

		/**
		 * @param {string} progressText
		 * @param {string} progressWidth
		 * @param {boolean} isLeftPlayer
		 */
		const CreateProgressRow = ( progressText, progressWidth, isLeftPlayer = true ) =>
		{
			const progressRow = document.createElement( 'div' );
			progressRow.className = 'steamdb_achievement_status_row steamdb_achievement_status_locked';

			const progress = document.createElement( 'div' );
			progress.className = 'steamdb_achievement_progress';
			progressRow.append( progress );

			if( !isLeftPlayer )
			{
				progress.classList.add( 'steamdb_achievement_progress_compare' );
				// removing parentheses from start and end of second player progress text
				progressText = progressText.replace( /^\(/, '' ).replace( /\)$/, '' );

				// trying to get progress based on text, as right player doesn't have a bar
				const [ current, total ] = progressText.split( '/' ).map( ( val ) => val.replace( /,/g, '' ).trim() );
				progressWidth = Math.ceil( Number.parseInt( current, 10 ) / Number.parseInt( total, 10 ) * 100 ) + '%';
			}

			const info = document.createElement( 'div' );
			info.textContent = progressText;
			progress.append( info );

			const progressBar = document.createElement( 'div' );
			progressBar.className = 'steamdb_achievement_progressbar';
			info.append( progressBar );

			const progressBarInner = document.createElement( 'div' );
			progressBarInner.className = 'steamdb_achievement_progressbar_inner';
			progressBarInner.style.width = progressWidth;
			progressBar.append( progressBarInner );

			if( isCompareView )
			{
				const avatar = document.createElement( 'img' );
				avatar.className = 'steamdb_achievement_status_avatar';
				avatar.src = isLeftPlayer ? leftAvatarUrl : rightAvatarUrl;
				progressRow.append( avatar );
			}

			return progressRow;
		};

		/**
		 * @param {boolean} isLeftPlayer
		 */
		const CreateLockRow = ( isLeftPlayer ) =>
		{
			const lockRow = document.createElement( 'div' );
			lockRow.className = 'steamdb_achievement_status_row steamdb_achievement_status_locked';

			const avatar = document.createElement( 'img' );
			avatar.className = 'steamdb_achievement_status_avatar';
			avatar.src = isLeftPlayer ? leftAvatarUrl : rightAvatarUrl;
			lockRow.append( avatar );

			return lockRow;
		};

		/**
		 * @param {object} obj
		 * @param {number} obj.id
		 * @param {ApiGameAchievement} obj.achievement
		 * @param {PlayerAchievement} obj.player
		 */
		const CreateAchievementRow = ( { id, achievement, player } ) =>
		{
			const element = document.createElement( 'div' );
			element.className = 'steamdb_achievement';

			if( id < 100 )
			{
				element.style.viewTransitionName = `steamdb-achievement-${id}`;
			}

			const image = document.createElement( 'img' );
			image.src = `${applicationConfig.MEDIA_CDN_COMMUNITY_URL}images/apps/${appid}/${!isPersonal || player.unlock || !achievement.icon_gray ? achievement.icon : achievement.icon_gray}`;
			image.className = 'steamdb_achievement_image';
			element.append( image );

			const nameContainer = document.createElement( 'div' );
			element.append( nameContainer );

			const name = document.createElement( 'h3' );
			name.textContent = achievement.localized_name;
			nameContainer.append( name );

			if(
				achievement.hidden &&
				( ( !player.unlock && !isCompareView ) ||
					( !player.unlockCompare && isCompareView ) )
			)
			{
				const hiddenAch = document.createElement( 'i' );
				hiddenAch.textContent = _t( 'hidden_achievement' );

				const desc = document.createElement( 'span' );
				desc.textContent = achievement.localized_desc;

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
				desc.textContent = achievement.localized_desc;
				nameContainer.append( desc );
			}

			if( !isPersonal )
			{
				const unlock = document.createElement( 'div' );
				unlock.className = 'steamdb_achievement_unlock_global';
				unlock.textContent = percentFormatter.format( achievement.global_unlock );
				element.append( unlock );

				const checkmark = document.createElement( 'div' );
				checkmark.className = 'steamdb_achievement_checkmark';
				element.prepend( checkmark );

				if( player.unlock )
				{
					element.classList.add( 'steamdb_earned_achievement' );

					checkmark.innerHTML = `
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
							<path d="M31.09 4.38L13 22.46L5.41 14.88L1.88 18.41L13 29.54L34.62 7.91L31.09 4.38Z"/>
						</svg>
					`;

					if( achievement.global_unlock < 0.1 )
					{
						image.classList.add( 'steamdb_achievement_image_glow' );
					}
				}

				element.classList.add( 'steamdb_achievement_global_progress_overlay' );
				element.style.setProperty( '--steamdb-progress', `${Math.round( achievement.global_unlock * 100 )}%` );

				return element;
			}

			if( showGlobalUnlock )
			{
				const globalUnlock = document.createElement( 'h6' );
				globalUnlock.textContent = _t( 'achievement_global_unlock', [ percentFormatter.format( achievement.global_unlock ) ] );
				nameContainer.append( globalUnlock );
			}

			const status = document.createElement( 'div' );
			status.className = 'steamdb_achievement_status';

			if( player.unlock )
			{
				const unlockRow = CreateUnlockRow(
					player.unlock,
					player.unlockTimestamp,
					true,
				);
				status.append( unlockRow );
			}
			else if( player.progressText )
			{
				const progressRow = CreateProgressRow( player.progressText, player.progressWidth, true );
				status.append( progressRow );
			}
			else if( isCompareView )
			{
				const locked = CreateLockRow( true );
				status.append( locked );
			}

			if( player.unlockCompare )
			{
				const unlockRow = CreateUnlockRow(
					player.unlockCompare,
					null,
					false,
				);
				status.append( unlockRow );
			}
			else if( player.progressTextCompare )
			{
				const progressRow = CreateProgressRow( player.progressTextCompare, null, false );
				status.append( progressRow );
			}
			else if( isCompareView )
			{
				const locked = CreateLockRow( false );
				status.append( locked );
			}

			if( achievement.global_unlock < 0.1 )
			{
				image.classList.add( 'steamdb_achievement_image_glow' );
			}

			element.append( status );

			if( isCompareView )
			{
				const imageCompare = document.createElement( 'img' );
				imageCompare.src = `${applicationConfig.MEDIA_CDN_COMMUNITY_URL}images/apps/${appid}/${player.unlockCompare || !achievement.icon_gray ? achievement.icon : achievement.icon_gray}`;
				imageCompare.className = 'steamdb_achievement_image steamdb_achievement_image_compare';
				element.append( imageCompare );
			}

			return element;
		};

		let counter = 0;
		const newContainer = document.createElement( 'div' );
		newContainer.className = 'steamdb_achievements_container';

		const searchField = document.createElement( 'input' );
		searchField.name = 'achievements-search';
		searchField.maxLength = 255;
		searchField.type = 'search';
		searchField.placeholder = _t( 'search' );
		searchField.setAttribute( 'accesskey', '/' );

		const searchFieldContainer = document.createElement( 'div' );
		searchFieldContainer.className = 'steamdb_achievement_search';
		searchFieldContainer.append( searchField );
		newContainer.append( searchFieldContainer );

		searchField.addEventListener( 'input', function()
		{
			const searchVal = this.value.trim().toUpperCase();

			/** @type {NodeListOf<HTMLElement>} */
			const achievementGroups = document.querySelectorAll( '.steamdb_achievements_group' );

			StartViewTransition( () =>
			{
				if( searchVal.length === 0 )
				{
					for( const group of achievementGroups )
					{
						/** @type {NodeListOf<HTMLElement>} */
						const achievementElements = group.querySelectorAll( '.steamdb_achievement' );

						for( const achievement of achievementElements )
						{
							achievement.hidden = false;
						}

						group.hidden = false;
					}

					return;
				}

				for( const group of achievementGroups )
				{
					let count = 0;

					/** @type {NodeListOf<HTMLElement>} */
					const achievementElements = group.querySelectorAll( '.steamdb_achievement' );

					for( const achievement of achievementElements )
					{
						const title = achievement.querySelector( 'h3' ).textContent;
						const description = achievement.querySelector( 'h5' ).textContent;
						const found = title.toUpperCase().includes( searchVal ) || description.toUpperCase().includes( searchVal );
						achievement.hidden = !found;

						if( found )
						{
							count++;
						}
					}

					group.hidden = count === 0;
				}
			} );
		} );

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

		/**
		 * @param {number} earned
		 * @param {number} total
		 * @param {boolean} isLeftPlayer
		 */
		const CreateProgressSummary = ( earned, total, isLeftPlayer = true ) =>
		{
			const percentage = earned / total;
			const progress = document.createElement( 'div' );
			progress.className = 'steamdb_achievement_progress';
			if( !isLeftPlayer )
			{
				progress.classList.add( 'steamdb_achievement_progress_compare' );
			}

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

			if( isCompareView )
			{
				const avatar = document.createElement( 'img' );
				avatar.className = 'steamdb_achievement_progress_avatar';
				avatar.src = isLeftPlayer ? leftAvatarUrl : rightAvatarUrl;
				progress.append( avatar );
			}

			return progress;
		};

		for( let updateId = 0; updateId < achievementUpdates.length; updateId++ )
		{
			const update = achievementUpdates[ updateId ];

			if( update.achievementData.length === 0 )
			{
				continue;
			}

			const gameGroup = document.createElement( 'div' );
			gameGroup.className = 'steamdb_achievements_group';
			newContainer.append( gameGroup );

			{
				const summary = document.createElement( 'div' );
				summary.className = 'steamdb_achievements_title';
				gameGroup.append( summary );

				const dlcAppId = update.dlcAppId || appid;
				const logoAppId = update.logoAppId || dlcAppId;

				const summaryGameLogo = document.createElement( 'a' );
				summaryGameLogo.className = 'steamdb_achievements_game_logo_contain';
				summaryGameLogo.href = `https://store.steampowered.com/app/${dlcAppId}`;
				summary.append( summaryGameLogo );

				const summaryGameLogoImg = document.createElement( 'img' );
				summaryGameLogoImg.className = 'steamdb_achievements_game_logo';
				summaryGameLogoImg.src = pageData.capsuleUrl;
				summaryGameLogo.append( summaryGameLogoImg );

				if( updateId === 0 )
				{
					summaryGameLogo.style.viewTransitionName = 'steamdb-gamelogo';
				}
				else if( logoAppId !== appid )
				{
					summaryGameLogoImg.dataset.appid = logoAppId.toString();
				}

				const summaryName = document.createElement( 'div' );
				summaryName.className = 'steamdb_achievements_game_name';
				summaryName.textContent = update.dlcAppName || update.name || 'Update';

				if( update.dlcAppName && update.name )
				{
					const summaryName2 = document.createElement( 'span' );
					summaryName2.className = 'steamdb_achievements_update_name';
					summaryName2.textContent = ` — ${update.name}`;
					summaryName.append( summaryName2 );
				}

				if( update.earned === update.achievementData.length )
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

				{
					const progress = CreateProgressSummary( update.earned, update.achievementData.length, true );
					summaryText.append( progress );
				}

				if( isCompareView )
				{
					const progress = CreateProgressSummary( update.earnedCompare, update.achievementData.length, false );
					summaryText.append( progress );
				}

				summary.append( CreateFoldButton() );
			}

			if( isPersonal )
			{
				const lockedAchievementsDetails = document.createElement( 'details' );
				const unlockedAchievementsDetails = document.createElement( 'details' );

				unlockedAchievementsDetails.id = `steamdb_ach_details_${appid}_${counter++}`;
				lockedAchievementsDetails.id = `steamdb_ach_details_${appid}_${counter++}`;

				lockedAchievementsDetails.addEventListener( 'toggle', OnToggleDetails );
				unlockedAchievementsDetails.addEventListener( 'toggle', OnToggleDetails );

				update.earnedDetailsElement = unlockedAchievementsDetails;

				{
					const unlockedAchievementsSummary = document.createElement( 'summary' );
					unlockedAchievementsSummary.textContent = _t( 'achievements_unlocked_count', [ update.earned.toString() ] );
					unlockedAchievementsDetails.className = 'steamdb_achievements_list';
					unlockedAchievementsDetails.open = !IsSessionStorageSet( unlockedAchievementsDetails.id );
					unlockedAchievementsDetails.append( unlockedAchievementsSummary );

					const lockedAchievementsSummary = document.createElement( 'summary' );
					lockedAchievementsSummary.textContent = _t( 'achievements_locked_count', [ ( update.achievementData.length - update.earned ).toString() ] );
					lockedAchievementsDetails.className = 'steamdb_achievements_list';
					lockedAchievementsDetails.open = !IsSessionStorageSet( lockedAchievementsDetails.id );
					lockedAchievementsDetails.append( lockedAchievementsSummary );
				}

				// Sort by unlock state, global unlock percentage, id
				update.achievementData.sort( ( a, b ) =>
				{
					const aUnlocked = !!a.player.unlock;
					const bUnlocked = !!b.player.unlock;

					if( aUnlocked !== bUnlocked )
					{
						return bUnlocked ? 1 : -1;
					}

					if( b.achievement.player_percent_unlocked === a.achievement.player_percent_unlocked )
					{
						return a.id - b.id;
					}

					return b.achievement.global_unlock > a.achievement.global_unlock ? 1 : -1;
				} );

				for( const achievement of update.achievementData )
				{
					if( achievement.update !== updateId )
					{
						continue;
					}

					const element = CreateAchievementRow( achievement );

					if( achievement.player.unlock )
					{
						unlockedAchievementsDetails.append( element );
					}
					else
					{
						lockedAchievementsDetails.append( element );
					}
				}

				if( unlockedAchievementsDetails.childElementCount > 1 )
				{
					gameGroup.append( unlockedAchievementsDetails );
				}

				if( lockedAchievementsDetails.childElementCount > 1 )
				{
					gameGroup.append( lockedAchievementsDetails );
				}
			}
			else
			{
				const globalAchievementsContainer = document.createElement( 'details' );
				globalAchievementsContainer.open = true;

				const globalAchievementsSummary = document.createElement( 'summary' );
				globalAchievementsSummary.setAttribute( 'hidden', 'true' );
				globalAchievementsContainer.append( globalAchievementsSummary );

				// Sort by global unlock rate
				update.achievementData.sort( ( a, b ) =>
				{
					if( b.achievement.player_percent_unlocked === a.achievement.player_percent_unlocked )
					{
						return a.id - b.id;
					}

					return b.achievement.global_unlock > a.achievement.global_unlock ? 1 : -1;
				} );

				for( const achievement of update.achievementData )
				{
					if( achievement.update !== updateId )
					{
						continue;
					}

					const element = CreateAchievementRow( achievement );
					globalAchievementsContainer.append( element );
				}

				if( globalAchievementsContainer.childElementCount > 0 )
				{
					gameGroup.append( globalAchievementsContainer );
				}
			}
		}

		if( achievementUpdates.length > 1 )
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

		const ReplaceAchievements = () =>
		{
			// React can re-render the page after boot, which leaves the element we found earlier detached
			nativeList = FindNativeList() || nativeList;

			newContainer.prepend( extraTabs );
			nativeList.insertAdjacentElement( 'beforebegin', newContainer );
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

			// Steam's own filter bar only controls its (now hidden) list: hide the topmost element that does not hold the list
			/** @type {Element|null} */
			let bar = document.querySelector( '[role="switch"]' );

			while( bar && bar.parentElement && !bar.parentElement.contains( nativeList ) )
			{
				bar = bar.parentElement;
			}

			/** @type {HTMLElement|null} */ ( bar )?.style.setProperty( 'display', 'none', 'important' );

			// React may re-render and drop our container, put it back
			new MutationObserver( () =>
			{
				if( newContainer.isConnected )
				{
					return;
				}

				const list = FindNativeList();

				if( list )
				{
					nativeList = list;
					list.insertAdjacentElement( 'beforebegin', newContainer );
					list.style.setProperty( 'display', 'none', 'important' );
				}
			} ).observe( document.body, { childList: true, subtree: true } );

			if( dlcCapsulesPromise )
			{
				dlcCapsulesPromise.then( ( images ) =>
				{
					for( const [ dlcAppId, url ] of images )
					{
						/** @type {NodeListOf<HTMLImageElement>} */
						const imageTags = document.querySelectorAll( `.steamdb_achievements_game_logo[data-appid="${dlcAppId}"]` );

						for( const image of imageTags )
						{
							image.src = url;
						}
					}
				} ).catch( ( e ) => console.error( '[SteamDB]', e ) );
			}

			// As we are completely redrawing the achievement list, sorting added by
			// Augmented Steam won't work it, hide their sorting to prevent user confusion
			document.querySelector( '.es-sortbox' )?.setAttribute( 'hidden', 'true' );
		};

		StartViewTransition( ReplaceAchievements );

		if( sortButton )
		{
			HookSortButton( sortButton, achievementUpdates, CreateAchievementRow );
		}
	}
}

/**
 * @param {ApplicationConfig} applicationConfig
 * @param {number} appid
 * @param {AchievementGroup[]} achievementUpdates
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
		return Promise.resolve( images );
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

/**
 * @typedef {{WEBAPI_BASE_URL: string, WEBAPI_ACCESS_TOKEN?: string, MEDIA_CDN_COMMUNITY_URL?: string, LANGUAGE?: string, STORE_ITEM_BASE_URL?: string, COUNTRY?: string, EREALM?: string}} ApplicationConfig
 */

/**
 * @returns {HTMLElement|null}
 */
function FindNativeList()
{
	/** @type {HTMLElement|null} */
	let list = document.querySelector( '[data-tableindex]' )?.parentElement;

	// The virtualized list wrapper: plain (non-hashed) "Panel" class + position: relative
	while( list && !( list.classList.contains( 'Panel' ) && list.style.position === 'relative' ) )
	{
		list = list.parentElement;
	}

	return list;
}

/**
 * Resolves when Steam's own script is done with the server rendered page, so that
 * our DOM changes are not wiped (or cause a hydration error) by React booting.
 * @returns {Promise<HTMLElement|null>}
 */
function WaitForNativeList()
{
	return new Promise( ( resolve ) =>
	{
		const start = Date.now();

		const check = () =>
		{
			const list = FindNativeList();

			// Steam removes the server rendered data element after it has booted
			if( list && ( !document.getElementById( 'valve-ssr-data' ) || Date.now() - start > 5000 ) )
			{
				// shortcut: fixed settle delay so React finished hydrating, there is no signal for it
				setTimeout( () => resolve( list ), 1500 );
			}
			else if( Date.now() - start > 15000 )
			{
				resolve( null );
			}
			else
			{
				setTimeout( check, 100 );
			}
		};

		check();
	} );
}

/**
 * @typedef {object} PageData
 * @property {ApplicationConfig} config
 * @property {boolean} hasNativeSets
 * @property {string} capsuleUrl
 * @property {Map<string, number>} internalKeys - achievement api name to Steam's internal key
 * @property {Record<number, {unlocked: boolean, unlock_time?: number}>} userAchievements
 */

/**
 * The page's own script removes the server rendered data after boot, so request the page again to read it.
 * @param {number} appid
 * @returns {Promise<PageData|null>}
 */
async function LoadPageData( appid )
{
	const response = await fetch( location.href, { headers: { Accept: 'text/html' } } );
	const doc = new DOMParser().parseFromString( await response.text(), 'text/html' );
	const dataElement = doc.getElementById( 'valve-ssr-data' );

	if( !dataElement )
	{
		return null;
	}

	const ssr = JSON.parse( dataElement.textContent );
	const queries = JSON.parse( ssr.renderContext.queryData ).queries;

	const find = ( /** @type {string} */ kind ) => queries.find( ( /** @type {any} */ q ) =>
		q.queryKey[ 0 ] === 'achievements' && q.queryKey[ 1 ] === appid && q.queryKey[ 2 ] === kind
	)?.state?.data;

	const schema = find( 'schema_v2' );

	if( !schema || !schema.groups )
	{
		return null;
	}

	/** @type {ApplicationConfig} */
	const config = { ...ssr.Config };

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
		// Not logged in, there is no token
	}

	/** @type {Map<string, number>} */
	const internalKeys = new Map();

	for( const group of schema.groups )
	{
		for( const achievement of group.achievements )
		{
			internalKeys.set( achievement.api_name, achievement.internal_key );
		}
	}

	// Newer apps have hashed asset paths, the store item data has the real one
	const assets = queries.find( ( /** @type {any} */ q ) => q.queryKey[ 0 ] === 'StoreItem' && q.queryKey[ 2 ] === 'include_assets_without_overrides' )?.state?.data;
	let capsuleUrl = `${config.STORE_ITEM_BASE_URL}steam/apps/${appid}/header.jpg`;

	if( assets?.header && assets.asset_url_format )
	{
		// eslint-disable-next-line no-template-curly-in-string
		capsuleUrl = config.STORE_ITEM_BASE_URL + assets.asset_url_format.replace( '${FILENAME}', assets.header );
	}

	return {
		config,
		capsuleUrl,
		hasNativeSets: schema.groups.some( ( /** @type {any} */ g ) => g.id !== 0 && g.achievements.length > 0 ),
		internalKeys,
		userAchievements: find( 'user_achievements' )?.achievements || {},
	};
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
 * @param {HTMLButtonElement} sortButton
 * @param {AchievementGroup[]} achievementUpdates
 * @param {(data: AchievementData) => HTMLDivElement} CreateAchievementRow
 */
function HookSortButton( sortButton, achievementUpdates, CreateAchievementRow )
{
	sortButton.addEventListener( 'click', ( /** @type {MouseEvent} */ e ) =>
	{
		e.preventDefault();

		// Redraw earned achievements blocks with new sorting
		StartViewTransition( () =>
		{
			sortButton.remove();

			for( const update of achievementUpdates )
			{
				if( !update.earnedDetailsElement )
				{
					continue;
				}

				while( update.earnedDetailsElement.lastElementChild.tagName !== 'SUMMARY' )
				{
					update.earnedDetailsElement.lastElementChild.remove();
				}

				const unlocked = update.achievementData
					.filter( ( a ) => a.player.unlock )
					.sort( ( a, b ) => a.player.unlockTimestamp === b.player.unlockTimestamp ?
						a.id - b.id :
						b.player.unlockTimestamp - a.player.unlockTimestamp );

				for( const achievement of unlocked )
				{
					update.earnedDetailsElement.append( CreateAchievementRow( achievement ) );
				}
			}
		} );
	}, { once: true } );
}

/**
 * @param {MouseEvent} e
 * @param {HTMLElement|undefined} parent
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

	// Figure out if any of the elements are currently open
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

	const container = document.getElementById( 'mainContents' );
	const state = container.classList.contains( 'steamdb_hide_earned_achievements' );

	const ToggleEarned = () =>
	{
		container.classList.toggle( 'steamdb_hide_earned_achievements', !state );
	};

	StartViewTransition( ToggleEarned );

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
