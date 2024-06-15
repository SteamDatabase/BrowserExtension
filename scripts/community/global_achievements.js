'use strict';

GetOption( {
	'spoiler-achievements': true,
}, function( items )
{
	const currentUser = document.querySelector( '#global_actions .user_avatar' );
	const currentUserPath = window.location.pathname.match( /^\/stats\/\w+/ );

	if( currentUser && currentUserPath )
	{
		const currentUserUrl = currentUser.href.replace( /\/$/, '' );

		const tab = document.createElement( 'div' );
		tab.className = 'tab steamdb_stats_tab';

		const link = document.createElement( 'a' );
		link.className = 'tabOn';
		link.href = `${currentUserUrl}${currentUserPath}?tab=achievements`;
		link.textContent = _t( 'view_your_achievements' );

		tab.appendChild( link );
		document.querySelector( '#tabs' ).appendChild( tab );
	}

	const spoilerAchievements = !!items[ 'spoiler-achievements' ];

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

			const elements = document.querySelectorAll( '.achieveRow:not(.unlocked) .achieveTxt > h3' );
			const achievements = response.response.achievements;

			for( const achievement of achievements )
			{
				if( !achievement.hidden )
				{
					continue;
				}

				for( const element of elements )
				{
					if( element.textContent !== achievement.localized_name )
					{
						continue;
					}

					const parent = element.parentNode.querySelector( 'h5' );

					const hiddenAchiev = document.createElement( 'i' );
					hiddenAchiev.textContent = _t( 'hidden_achievement' );
					parent.appendChild( hiddenAchiev );

					if( spoilerAchievements )
					{
						const span = document.createElement( 'span' );
						span.className = 'steamdb_achievement_spoiler';
						span.appendChild( document.createTextNode( achievement.localized_desc ) );

						parent.appendChild( span );
					}
					else
					{
						parent.appendChild( document.createTextNode( achievement.localized_desc ) );
					}

					break;
				}
			}
		} );
} );
