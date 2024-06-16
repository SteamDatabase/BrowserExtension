'use strict';

GetOption( {
	'improve-achievements': true,
	'spoiler-achievements': true,
	'achievements-global-unlock': true,
}, function( items )
{
	if( !items[ 'improve-achievements' ] )
	{
		return;
	}

	const spoilerAchievements = !!items[ 'spoiler-achievements' ];
	const showGlobalUnlock = !!items[ 'achievements-global-unlock' ];
	const oldContainer = document.getElementById( 'personalAchieve' );

	if( !oldContainer )
	{
		return;
	}

	const appIdElement = document.querySelector( '.profile_small_header_additional .gameLogo a' );

	if( !appIdElement )
	{
		return;
	}

	const appidMatch = appIdElement.href.match( /\/app\/(?<id>[0-9]+)/ );

	if( !appidMatch )
	{
		return;
	}

	const appid = appidMatch.groups.id;

	// SteamDB link
	{
		const tab = document.createElement( 'div' );
		tab.className = 'tab steamdb_stats_tab';

		const link = document.createElement( 'a' );
		link.className = 'tabOn';
		link.href = `${GetHomepage()}app/${appid}/stats/`;
		link.textContent = 'SteamDB';

		tab.appendChild( link );
		document.querySelector( '#tabs' ).appendChild( tab );
	}

	if( oldContainer.classList.contains( 'compare_view' ) )
	{
		return;
	}

	const applicationConfigElement = document.getElementById( 'application_config' );

	if( !applicationConfigElement )
	{
		return;
	}

	const accessToken = JSON.parse( applicationConfigElement.dataset.loyalty_webapi_token );

	if( !accessToken )
	{
		return;
	}

	const applicationConfig = JSON.parse( applicationConfigElement.dataset.config );

	const params = new URLSearchParams();
	params.set( 'format', 'json' );
	params.set( 'access_token', accessToken );
	params.set( 'appid', appid );
	params.set( 'language', applicationConfig.LANGUAGE );
	params.set( 'x_requested_with', 'SteamDB' ); // Request header field x-requested-with is not allowed by Access-Control-Allow-Headers in preflight response.

	fetch( `${applicationConfig.WEBAPI_BASE_URL}IPlayerService/GetGameAchievements/v1/?${params.toString()}` )
		.then( ( response ) => response.json() )
		.then( ( response ) =>
		{
			if( !response || !response.response || !response.response.achievements )
			{
				return;
			}

			const newContainer = document.createElement( 'div' );
			newContainer.className = 'steamdb_achievements_container';

			const details = document.createElement( 'div' );
			details.className = 'steamdb_achievements_group';
			newContainer.append( details );

			const oldAchievementRows = document.querySelectorAll( '.achieveRow' );
			const achievementsData = [];
			const seenAchievements = new Set();
			const achievements = response.response.achievements;
			let unlockedAchievements = 0;
			let domId = 0;

			// Match all achievements on the page to API data
			for( domId = 0; domId < oldAchievementRows.length; domId++ )
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
				const unlock = element.querySelector( '.achieveUnlockTime' )?.textContent.trim();
				const progress = element.querySelector( '.achievementProgressBar' );
				let progressText = null;
				let progressWidth = null;

				if( progress )
				{
					progressText = progress.querySelector( '.progressText' ).textContent.trim();
					progressWidth = progress.querySelector( '.progress' ).style.width;
				}

				if( unlock )
				{
					unlockedAchievements++;
				}

				let foundAchievement = false;

				for( let id = 0; id < achievements.length; id++ )
				{
					const achievement = achievements[ id ];

					if( name !== achievement.localized_name )
					{
						continue;
					}

					const apiIcon = unlock ? achievement.icon : achievement.icon_gray;

					if( icon !== apiIcon )
					{
						console.error( 'Mismatching icon', icon, achievement );
						continue;
					}

					achievement.global_unlock = parseFloat( achievement.player_percent_unlocked ) / 100.0;

					seenAchievements.add( achievement.internal_name );
					achievementsData.push( {
						id,
						domId,
						achievement,
						player: {
							unlock,
							progressText,
							progressWidth,
						},
					} );

					foundAchievement = true;
					element.style.viewTransitionName = `achievement-${id}`;

					break;
				}

				if( !foundAchievement )
				{
					console.error( 'Failed to find achievement', name, icon );
				}
			}

			// Add hidden achievements
			for( let id = 0; id < achievements.length; id++ )
			{
				const achievement = achievements[ id ];

				if( seenAchievements.has( achievement.internal_name ) )
				{
					continue;
				}

				achievement.global_unlock = parseFloat( achievement.player_percent_unlocked ) / 100.0;

				achievementsData.push( {
					id,
					domId: null,
					achievement,
					player: {
						unlock: null,
						progressText: null,
						progressWidth: null,
					},
				} );
			}

			// Sort by unlock state, then by global unlock percentage, then by id
			achievementsData.sort( ( a, b ) =>
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

			const numberFormatter = new Intl.NumberFormat( GetLanguage(), {
				style: 'percent',
				minimumFractionDigits: 1,
				maximumFractionDigits: 1,
			} );

			const lockedAchievementsDetails = document.createElement( 'details' );
			const unlockedAchievementsDetails = document.createElement( 'details' );
			const unlockedAchievementsSummary = document.createElement( 'summary' );
			const sortButton = document.createElement( 'button' );

			{
				unlockedAchievementsDetails.className = 'steamdb_achievements_list';
				unlockedAchievementsDetails.open = true;
				unlockedAchievementsDetails.append( unlockedAchievementsSummary );

				sortButton.type = 'button';
				sortButton.className = 'btn_grey_black btn_small_thin steamdb_achievements_sort_button';

				unlockedAchievementsSummary.textContent = _t( 'achievements_unlocked_count', [ unlockedAchievements.toString() ] );

				const sortButtonText = document.createElement( 'span' );
				sortButtonText.textContent = _t( 'achievements_sort_by_time' );
				sortButton.append( sortButtonText );
				unlockedAchievementsSummary.append( sortButton );
			}

			{
				const lockedAchievementsSummary = document.createElement( 'summary' );
				lockedAchievementsSummary.textContent = _t( 'achievements_locked_count', [ ( achievements.length - unlockedAchievements ).toString() ] );

				lockedAchievementsDetails.className = 'steamdb_achievements_list';
				lockedAchievementsDetails.open = true;
				lockedAchievementsDetails.append( lockedAchievementsSummary );
			}

			const CreateAchievementRow = ( { id, achievement, player } ) =>
			{
				const element = document.createElement( 'div' );
				element.className = 'steamdb_achievement';
				element.style.viewTransitionName = `achievement-${id}`;

				const image = document.createElement( 'img' );
				image.src = `${applicationConfig.MEDIA_CDN_COMMUNITY_URL}images/apps/${appid}/${player.unlock ? achievement.icon : achievement.icon_gray}`;
				image.className = 'steamdb_achievement_image';
				image.loading = 'lazy';
				element.append( image );

				const nameContainer = document.createElement( 'div' );
				nameContainer.className = '';
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
						image.classList.add( 'steamdb_achievement_spoiler' );
						name.classList.add( 'steamdb_achievement_spoiler' );
						desc.classList.add( 'steamdb_achievement_spoiler' );
					}
				}
				else
				{
					const desc = document.createElement( 'h5' );
					desc.textContent = achievement.localized_desc;
					nameContainer.append( desc );
				}

				if( showGlobalUnlock )
				{
					const globalUnlock = document.createElement( 'h6' );
					globalUnlock.textContent = _t( 'achievement_global_unlock', [ numberFormatter.format( achievement.global_unlock ) ] );
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

			for( const achievement of achievementsData )
			{
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
				details.append( unlockedAchievementsDetails );
			}

			if( lockedAchievementsDetails.childElementCount > 1 )
			{
				details.append( lockedAchievementsDetails );
			}

			// Make the scrollbar stable so the page doesn't shift when collapsing all elements
			document.documentElement.style.scrollbarGutter = 'stable';

			const ReplaceAchievements = () =>
			{
				oldContainer.insertAdjacentElement( 'beforebegin', newContainer );
				oldContainer.hidden = true;
			};

			if( document.startViewTransition )
			{
				document.startViewTransition( ReplaceAchievements );
			}
			else
			{
				ReplaceAchievements();
			}

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

						for( const achievement of achievementsData )
						{
							if( achievement.domId === null )
							{
								continue;
							}

							achievementDataMap[ achievement.domId ] = achievement;
						}

						const unlockedAchievements = [];

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
							unlockedAchievements.push( achievement );
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

						// Redraw earned achievements block with new sorting
						const RedrawSortedAchievements = () =>
						{
							sortButton.remove();

							while( unlockedAchievementsDetails.lastElementChild !== unlockedAchievementsSummary )
							{
								unlockedAchievementsDetails.lastElementChild.remove();
							}

							for( const achievement of unlockedAchievements )
							{
								const element = CreateAchievementRow( achievement );
								unlockedAchievementsDetails.append( element );
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
						console.error( e );
						alert( `Failed to sort achievements: ${e.message}` );
					} );
			}, { once: true } );
		} );
} );

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
