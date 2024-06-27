/* exported DoAchievements */
'use strict';

// eslint-disable-next-line no-unused-vars
function DoAchievements( isPersonal )
{
	GetOption( {
		'improve-achievements': true,
		'spoiler-achievements': true,
		'achievements-group-updates': true,
		'achievements-global-unlock': true,
	}, ( items ) =>
	{
		InitAchievements( items, isPersonal );
	} );
}

function InitAchievements( items, isPersonal )
{
	if( !items[ 'improve-achievements' ] )
	{
		return;
	}

	const spoilerAchievements = !!items[ 'spoiler-achievements' ];
	const showGlobalUnlock = !!items[ 'achievements-global-unlock' ];
	const oldContainer = document.getElementById( 'personalAchieve' );

	if( isPersonal && !oldContainer )
	{
		return;
	}

	const gameLogoElement = document.querySelector( '.profile_small_header_additional .gameLogo' );

	if( !gameLogoElement )
	{
		return;
	}

	const appIdElement = gameLogoElement.querySelector( 'a' );

	if( !appIdElement )
	{
		return;
	}

	gameLogoElement.style.viewTransitionName = 'steamdb-gamelogo';

	const appidMatch = appIdElement.href.match( /\/app\/(?<id>[0-9]+)/ );

	if( !appidMatch )
	{
		return;
	}

	const appid = appidMatch.groups.id;

	const extraTabs = document.createElement( 'div' );
	extraTabs.className = 'steamdb_stats_extra_tabs';

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

	extraTabs.append( CreateFoldButton( true ) );

	if( window.innerWidth < 600 )
	{
		extraTabs.classList.add( 'steamdb_stats_extra_tabs_mobile' );
		document.querySelector( '#subtabs' ).insertAdjacentElement( 'afterend', extraTabs );
	}
	else
	{
		document.querySelector( '#tabs' ).append( extraTabs );
	}

	if( isPersonal )
	{
		if( oldContainer.classList.contains( 'compare_view' ) )
		{
			return;
		}
	}
	else
	{
		// Some games like TF2 and CS:S have achievement groups, so skip if it's filtered
		const groupSelector = document.querySelector( '#headerContent select[name="group"]' );

		if( groupSelector && groupSelector.value !== 'all' )
		{
			return;
		}

		extraTabs.append( CreateHideDoneButton() );
	}

	const applicationConfig = ParseApplicationConfig();

	if( !applicationConfig.LANGUAGE )
	{
		WriteLog( 'Failed to find language' );
		return;
	}

	const params = new URLSearchParams();
	params.set( 'format', 'json' );

	if( applicationConfig.WEBAPI_ACCESS_TOKEN )
	{
		params.set( 'access_token', applicationConfig.WEBAPI_ACCESS_TOKEN );
	}

	params.set( 'appid', appid );
	params.set( 'language', applicationConfig.LANGUAGE );

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

				if( response && response.error )
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

			gameAchievementsFetch.then( ( gameAchievements ) =>
			{
				ProcessGameAchievements( gameAchievements, response.data );
			} ).catch( e => console.error( '[SteamDB]', e ) );
		} );
	}
	else
	{
		gameAchievementsFetch.then( ( gameAchievements ) =>
		{
			ProcessGameAchievements( gameAchievements, [] );
		} ).catch( e => console.error( '[SteamDB]', e ) );
	}

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

	function OnToggleAllGamesClick( e )
	{
		ToggleDetailsElements( e, document.querySelector( '.steamdb_achievements_container' ) );
	}

	function OnToggleGameClick( e )
	{
		ToggleDetailsElements( e, this.closest( '.steamdb_achievements_group' ) );
	}

	function CreateFoldButton( isRoot )
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

	function ToggleHideDone()
	{
		const id = 'steamdb_ach_done';
		const container = document.getElementById( 'mainContents' );
		const state = !IsSessionStorageSet( id );
		container.classList.toggle( 'hide_unlocked', state );
		try
		{
			if( !state )
			{
				sessionStorage.removeItem( id );
			}
			else
			{
				sessionStorage.setItem( id, '1' );
			}
		}
		catch
		{
			//
		}
	}

	function CreateHideDoneButton()
	{
		const btn = document.createElement( 'button' );
		btn.type = 'button';
		btn.className = 'steamdb_done_button';
		btn.addEventListener( 'click', ToggleHideDone );

		// https://fontawesome.com/license/free
		btn.innerHTML = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 24" width="21" height="24" fill="none" stroke="currentColor">
		  <path d="M20.559 4.941c0.586 0.586 0.586 1.537 0 2.123l-12 12c-0.586 0.586 -1.537 0.586 -2.123 0l-6 -6c-0.586 -0.586 -0.586 -1.537 0 -2.123s1.537 -0.586 2.123 0L7.5 15.877l10.941 -10.936c0.586 -0.586 1.537 -0.586 2.123 0z"/>
		</svg>`;

		return btn;
	}

	function ProcessGameAchievements( response, achievementUpdates )
	{
		if( !response || !response.response || !response.response.achievements )
		{
			return;
		}

		achievementUpdates.unshift( {
			name: document.title.match( /^.+? :: (?<name>.+) :: / )?.groups.name || 'Base Game',
			achievementApiNames: [],
		} );

		const achievementInternalIdToUpdate = new Map();

		for( let updateId = 0; updateId < achievementUpdates.length; updateId++ )
		{
			const update = achievementUpdates[ updateId ];
			update.earned = 0;
			update.achievementData = [];
			update.earnedDetailsElement = null;

			for( const achievement of update.achievementApiNames )
			{
				achievementInternalIdToUpdate.set( achievement, updateId );
			}
		}

		const oldAchievementRows = document.querySelectorAll( '.achieveRow' );
		const achievements = new Map( response.response.achievements.map( ( value, index ) => [ index, value ] ) );

		const AddAchievementData = ( id, domId, achievement, player ) =>
		{
			achievement.global_unlock = parseFloat( achievement.player_percent_unlocked ) / 100.0;

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
		};

		let badAchievementsLogged = 10;

		// Match all achievements on the page to API data
		for( let domId = 0; domId < oldAchievementRows.length; domId++ )
		{
			const element = oldAchievementRows[ domId ];
			const image = element.querySelector( '.achieveImgHolder > img' );

			if( !image )
			{
				// hidden achievements remaining element
				continue;
			}

			const iconSlash = image.src.lastIndexOf( '/' );
			const icon = iconSlash > 0 ? image.src.substring( iconSlash + 1 ) : null;

			const name = element.querySelector( '.achieveTxt > h3' ).textContent;
			const progress = element.querySelector( '.achievementProgressBar' );
			let progressText = null;
			let progressWidth = null;
			let unlock;

			if( isPersonal )
			{
				unlock = element.querySelector( '.achieveUnlockTime' )?.textContent.trim();
			}
			else
			{
				unlock = element.classList.contains( 'unlocked' );
			}

			if( progress )
			{
				progressText = progress.querySelector( '.progressText' ).textContent.trim();
				progressWidth = progress.querySelector( '.progress' ).style.width;
			}

			let foundAchievement = false;

			for( const [ id, achievement ] of achievements.entries() )
			{
				if( name !== achievement.localized_name )
				{
					continue;
				}

				const apiIcon = unlock || !isPersonal ? achievement.icon : achievement.icon_gray;

				if( icon !== apiIcon )
				{
					if( badAchievementsLogged-- > 0 )
					{
						WriteLog( 'Mismatching icon', icon, achievement );
					}

					continue;
				}

				AddAchievementData( id, domId, achievement, {
					unlock,
					progressText,
					progressWidth,
				} );

				foundAchievement = true;

				if( id < 100 )
				{
					element.style.viewTransitionName = `steamdb-achievement-${id}`;
				}

				achievements.delete( id );

				break;
			}

			if( !foundAchievement && badAchievementsLogged-- > 0 )
			{
				WriteLog( 'Failed to find achievement', name, icon );
			}
		}

		// Add hidden achievements
		for( const [ id, achievement ] of achievements.entries() )
		{
			AddAchievementData( id, null, achievement, {
				unlock: null,
				progressText: null,
				progressWidth: null,
			} );
		}

		const percentFormatter = new Intl.NumberFormat( GetLanguage(), {
			style: 'percent',
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		} );

		const CreateAchievementRow = ( { id, achievement, player } ) =>
		{
			const element = document.createElement( 'div' );
			element.className = 'steamdb_achievement';

			if( id < 100 )
			{
				element.style.viewTransitionName = `steamdb-achievement-${id}`;
			}

			const image = document.createElement( 'img' );
			image.src = `${applicationConfig.MEDIA_CDN_COMMUNITY_URL}images/apps/${appid}/${!isPersonal || player.unlock ? achievement.icon : achievement.icon_gray}`;
			image.className = 'steamdb_achievement_image';
			image.loading = 'lazy';
			element.append( image );

			const nameContainer = document.createElement( 'div' );
			element.append( nameContainer );

			const name = document.createElement( 'h3' );
			name.textContent = achievement.localized_name;
			nameContainer.append( name );

			if( achievement.hidden && !player.unlock )
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
					checkmark.innerHTML = `
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
							<path d="M31.09 4.38L13 22.46L5.41 14.88L1.88 18.41L13 29.54L34.62 7.91L31.09 4.38Z"/>
						</svg>
					`;
					checkmark.classList.add( 'unlock' );

					if( achievement.global_unlock < 0.1 )
					{
						image.classList.add( 'steamdb_achievement_image_glow' );
					}
				}

				const overlay = document.createElement( 'div' );
				overlay.className = 'steamdb_achievement_global_progress_overlay';
				overlay.style.width = `${Math.round( achievement.global_unlock * 100 )}%`;
				element.append( overlay );

				return element;
			}

			if( showGlobalUnlock )
			{
				const globalUnlock = document.createElement( 'h6' );
				globalUnlock.textContent = _t( 'achievement_global_unlock', [ percentFormatter.format( achievement.global_unlock ) ] );
				nameContainer.append( globalUnlock );
			}

			if( player.unlock )
			{
				const unlock = document.createElement( 'div' );
				unlock.className = 'steamdb_achievement_unlock';
				unlock.textContent = player.unlock;
				element.append( unlock );

				if( player.unlockTimestamp )
				{
					const relativeUnlock = document.createElement( 'div' );
					relativeUnlock.textContent = FormatRelativeTime( Date.now() - player.unlockTimestamp );
					unlock.append( relativeUnlock );
				}

				if( achievement.global_unlock < 0.1 )
				{
					image.classList.add( 'steamdb_achievement_image_glow' );
				}
			}
			else if( player.progressText )
			{
				const progress = document.createElement( 'div' );
				progress.className = 'steamdb_achievement_progress';
				progress.textContent = player.progressText;

				const progressBar = document.createElement( 'div' );
				progressBar.className = 'steamdb_achievement_progressbar';
				progress.append( progressBar );

				const progressBarInner = document.createElement( 'div' );
				progressBarInner.className = 'steamdb_achievement_progressbar_inner';
				progressBarInner.style.width = player.progressWidth;
				progressBar.append( progressBarInner );

				element.append( progress );
			}

			return element;
		};

		let counter = 0;
		const newContainer = document.createElement( 'div' );
		newContainer.className = 'steamdb_achievements_container';

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

				const summaryGameLogo = document.createElement( 'a' );
				summaryGameLogo.className = 'steamdb_achievements_game_logo_contain';
				summaryGameLogo.href = `https://store.steampowered.com/app/${dlcAppId}`;
				summary.append( summaryGameLogo );

				const summaryGameLogoImg = document.createElement( 'img' );
				summaryGameLogoImg.className = 'steamdb_achievements_game_logo';
				summaryGameLogo.append( summaryGameLogoImg );

				if( updateId === 0 )
				{
					summaryGameLogo.style.viewTransitionName = 'steamdb-gamelogo';
					summaryGameLogoImg.src = gameLogoElement.querySelector( 'img' ).src;
				}
				else
				{
					summaryGameLogoImg.src = `${applicationConfig.STORE_ICON_BASE_URL}${dlcAppId}/capsule_184x69.jpg`;
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
					const percentage = update.earned / update.achievementData.length;
					const progress = document.createElement( 'div' );
					progress.className = 'steamdb_achievement_progress';
					progress.textContent = `${update.earned} / ${update.achievementData.length} (${percentFormatter.format( percentage )})`;

					const progressBar = document.createElement( 'div' );
					progressBar.className = 'steamdb_achievement_progressbar';
					progress.append( progressBar );

					const progressBarInner = document.createElement( 'div' );
					progressBarInner.className = 'steamdb_achievement_progressbar_inner';
					progressBarInner.style.width = Math.round( percentage * 100 ) + '%';
					progressBar.append( progressBarInner );

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
				globalAchievementsSummary.setAttribute( 'hidden', true );
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
			if( isPersonal )
			{
				oldContainer.insertAdjacentElement( 'beforebegin', newContainer );
				oldContainer.hidden = true;
			}
			else
			{
				for( const el of oldAchievementRows )
				{
					el.hidden = true;
				}

				oldAchievementRows[ 0 ].insertAdjacentElement( 'beforebegin', newContainer );

				const classes = [ 'steamdb_global_achievements_page' ];
				if( IsSessionStorageSet( 'steamdb_ach_done' ) ) classes.push( 'hide_done' );
				document.getElementById( 'mainContents' ).classList.add( ...classes );
			}

			gameLogoElement.hidden = true;

			document.querySelector( '#topSummaryAchievements .achieveBar' )?.classList.add( 'steamdb_achievement_progressbar' );

			// As we are completely redrawing the achievement list, sorting added by
			// Augmented Steam won't work it, hide their sorting to prevent user confusion
			document.querySelector( '.es-sortbox' )?.setAttribute( 'hidden', true );
		};

		if( document.startViewTransition )
		{
			document.startViewTransition( ReplaceAchievements );
		}
		else
		{
			ReplaceAchievements();
		}

		if( sortButton )
		{
			HookSortButton( sortButton, achievementUpdates, oldAchievementRows, CreateAchievementRow );
		}
	}
}

function ParseApplicationConfig()
{
	const applicationConfigElement = document.getElementById( 'application_config' );

	if( applicationConfigElement )
	{
		const applicationConfig = JSON.parse( applicationConfigElement.dataset.config );
		const accessToken = JSON.parse( applicationConfigElement.dataset.loyalty_webapi_token );

		if( accessToken )
		{
			applicationConfig.WEBAPI_ACCESS_TOKEN = accessToken;
		}

		return applicationConfig;
	}

	// Application config does not exist if user is logged out, so we have to reconstruct the data
	const applicationConfig =
	{
		WEBAPI_BASE_URL: 'https://api.steampowered.com/',
	};

	for( const script of document.querySelectorAll( 'script[src]' ) )
	{
		const scriptLanguage = new URL( script.src ).searchParams.get( 'l' );

		if( scriptLanguage )
		{
			applicationConfig.LANGUAGE = scriptLanguage;
			break;
		}
	}

	// Game logo cdn
	const gameLogoUrl = document.querySelector( '.profile_small_header_additional .gameLogo img' ).src;
	const gameLogoUrlAppsIndex = gameLogoUrl.lastIndexOf( '/apps/' );

	if( gameLogoUrlAppsIndex > 0 )
	{
		applicationConfig.STORE_ICON_BASE_URL = gameLogoUrl.substring( 0, gameLogoUrlAppsIndex + '/apps/'.length );
	}

	// Media cdn
	for( const image of document.querySelectorAll( '.achieveImgHolder > img' ) )
	{
		const index = image.src.lastIndexOf( '/images/apps/' );

		if( index > 0 )
		{
			applicationConfig.MEDIA_CDN_COMMUNITY_URL = image.src.substring( 0, index + 1 );
			break;
		}
	}

	return applicationConfig;
}

const relativeDateFormatter = new Intl.RelativeTimeFormat( GetLanguage(), { numeric: 'auto' } );

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

function HookSortButton( sortButton, achievementUpdates, oldAchievementRows, CreateAchievementRow )
{
	sortButton.addEventListener( 'click', ( e ) =>
	{
		e.preventDefault();

		sortButton.setAttribute( 'disabled', true );

		// Request the same page in finnish because it has an easier date format to parse
		const url = new URL( window.location );
		url.searchParams.set( 'l', 'finnish' );

		fetch( url, {
			headers: {
				Accept: 'text/html',
				'X-Requested-With': 'SteamDB',
			},
		} )
			.then( response => response.text() )
			.then( text =>
			{
				const parser = new DOMParser();
				const htmlDocument = parser.parseFromString( text, 'text/html' );
				const otherAchievementRows = htmlDocument.querySelectorAll( '#personalAchieve .achieveRow' );

				if( otherAchievementRows.length !== oldAchievementRows.length )
				{
					throw new Error( 'Mismatching amount of achievements' );
				}

				const currentYear = new Date().getFullYear();

				const achievementDataMap = [];

				for( const update of achievementUpdates )
				{
					for( const achievement of update.achievementData )
					{
						if( achievement.domId === null )
						{
							continue;
						}

						achievementDataMap[ achievement.domId ] = achievement;
					}
				}

				const unlockedAchievementsPerUpdate = [];

				for( let updateId = 0; updateId < achievementUpdates.length; updateId++ )
				{
					unlockedAchievementsPerUpdate[ updateId ] = [];
				}

				// Assume the achievements are in the same order
				for( let id = 0; id < otherAchievementRows.length; id++ )
				{
					const otherAchievement = otherAchievementRows[ id ];
					const oldAchievement = oldAchievementRows[ id ];

					const otherImage = otherAchievement.querySelector( '.achieveImgHolder > img' );
					const oldImage = oldAchievement.querySelector( '.achieveImgHolder > img' );

					if( !otherImage || !oldImage )
					{
						continue;
					}

					// Verify that we are seeing the same achievements by their image at least
					if( otherImage.src !== oldImage.src )
					{
						throw new Error( 'Mismatching achievement icon' );
					}

					const unlock = otherAchievement.querySelector( '.achieveUnlockTime' )?.textContent.trim();

					if( !unlock )
					{
						continue;
					}

					const parsedTime = unlock.match( /Avattu (?<day>[0-9]+)\.(?<month>[0-9]+)\.(?<year>[0-9]+)? klo (?<hour>[0-9]+)\.(?<minute>[0-9]+)/ );

					if( !parsedTime )
					{
						throw new Error( 'Failed to parse unlock time' );
					}

					const c = parsedTime.groups;
					const date = new Date( c.year || currentYear, c.month - 1, c.day, c.hour, c.minute, 0, 0 );

					const achievement = achievementDataMap[ id ];
					achievement.player.unlockTimestamp = date.getTime();
					unlockedAchievementsPerUpdate[ achievement.update ].push( achievement );
				}

				// Redraw earned achievements block with new sorting
				const RedrawSortedAchievements = () =>
				{
					sortButton.remove();

					for( let updateId = 0; updateId < achievementUpdates.length; updateId++ )
					{
						const update = achievementUpdates[ updateId ];
						const unlockedAchievements = unlockedAchievementsPerUpdate[ updateId ];

						if( !update.earnedDetailsElement )
						{
							continue;
						}

						while( update.earnedDetailsElement.lastElementChild.tagName !== 'SUMMARY' )
						{
							update.earnedDetailsElement.lastElementChild.remove();
						}

						unlockedAchievements.sort( ( a, b ) =>
						{
							const aTime = a.player.unlockTimestamp;
							const bTime = b.player.unlockTimestamp;

							if( aTime === bTime )
							{
								return a.id - b.id;
							}

							return bTime > aTime ? 1 : -1;
						} );

						for( const achievement of unlockedAchievements )
						{
							const element = CreateAchievementRow( achievement );
							update.earnedDetailsElement.append( element );
						}
					}
				};

				if( document.startViewTransition )
				{
					document.startViewTransition( RedrawSortedAchievements );
				}
				else
				{
					RedrawSortedAchievements();
				}
			} )
			.catch( e =>
			{
				WriteLog( e );
				alert( `Failed to sort achievements: ${e.message}` );
			} );
	}, { once: true } );
}

function IsSessionStorageSet( key )
{
	try
	{
		return !!sessionStorage.getItem( key );
	}
	catch
	{
		return false;
	}
}

function OnToggleDetails()
{
	try
	{
		if( this.open )
		{
			sessionStorage.removeItem( this.id );
		}
		else
		{
			sessionStorage.setItem( this.id, '1' );
		}
	}
	catch
	{
		//
	}
}
