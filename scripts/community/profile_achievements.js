'use strict';

GetOption( {
	'hidden-achievements': true,
	'spoiler-achievements': true,
}, function( items )
{
	if( !items[ 'hidden-achievements' ] )
	{
		return;
	}

	const spoilerAchievements = !!items[ 'spoiler-achievements' ];
	let achievementsContainer = document.querySelector( '.achieveHiddenBox' );

	if( achievementsContainer )
	{
		achievementsContainer = achievementsContainer.parentNode.parentNode;

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

				const achievements = response.response.achievements;

				for( const achievement of achievements )
				{
					if( !achievement.hidden )
					{
						continue;
					}

					const image = document.createElement( 'img' );
					image.src = `${applicationConfig.MEDIA_CDN_COMMUNITY_URL}images/apps/${appid}/${achievement.icon_gray}`;

					const achieveImgHolder = document.createElement( 'div' );
					achieveImgHolder.className = 'achieveImgHolder';
					achieveImgHolder.appendChild( image );

					const h3 = document.createElement( 'h3' );
					h3.className = 'ellipsis';
					h3.appendChild( document.createTextNode( achievement.localized_name ) );

					const h5 = document.createElement( 'h5' );
					h5.className = 'ellipsis';

					if( spoilerAchievements )
					{
						const span = document.createElement( 'span' );
						span.className = 'steamdb_achievement_spoiler';
						span.appendChild( document.createTextNode( achievement.localized_desc ) );

						const hiddenAchiev = document.createElement( 'i' );
						hiddenAchiev.textContent = _t( 'hidden_achievement_hover' );

						h5.appendChild( hiddenAchiev );
						h5.appendChild( span );
					}
					else
					{
						const hiddenAchiev = document.createElement( 'i' );
						hiddenAchiev.textContent = _t( 'hidden_achievement' );

						h5.appendChild( hiddenAchiev );
						h5.appendChild( document.createTextNode( achievement.localized_desc ) );
					}

					const achieveTxt = document.createElement( 'div' );
					achieveTxt.className = 'achieveTxt';
					achieveTxt.appendChild( h3 );
					achieveTxt.appendChild( h5 );

					const achieveTxtHolder = document.createElement( 'div' );
					achieveTxtHolder.className = 'achieveTxtHolder';
					achieveTxtHolder.appendChild( achieveTxt );

					const achieveRow = document.createElement( 'div' );
					achieveRow.className = 'achieveRow';
					achieveRow.appendChild( achieveImgHolder );
					achieveRow.appendChild( achieveTxtHolder );

					achievementsContainer.appendChild( achieveRow );
				}
			} );
	}
} );
