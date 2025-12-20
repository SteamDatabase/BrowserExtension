'use strict';

( () =>
{
	const profilePagesRegex = /^https:\/\/steamcommunity\.com\/(id|profiles)\/[^/]+(\/games(\/[^/]+)?)?\/?$/;
	if( !profilePagesRegex.test( window.location.href ) )
	{
		return;
	}

	// Check if "games" part
	const isGamesPage = window.location.href.match( profilePagesRegex )[ 2 ] !== undefined;

	/** @type {HTMLScriptElement} */
	const currentScript = document.querySelector( '#steamdb_profile_gamecovers' );
	const fallbackCoverImage = currentScript.dataset.appLogo;

	/** @type {Map<number, HTMLImageElement>} */
	const appsImageStore = new Map();

	/**
	 * @param {string} url
	 * @returns {number}
	 */
	function GetAppIDFromUrl( url )
	{
		const appid = url.match( /\/(?:app|sub|bundle|friendsthatplay|gamecards|recommended|widget)\/(?<id>[0-9]+)/ );
		return appid ? Number.parseInt( appid.groups.id, 10 ) : -1;
	}

	/** @param {Record<string, any>} node */
	function GetReactFiber( node )
	{
		const reactFiberKey = Object.keys( node ).find( key => key.startsWith( '__reactFiber' ) );
		return node[ reactFiberKey ];
	}

	/** @param {HTMLImageElement} image */
	function CheckValidImg( image )
	{
		if( image.complete && image.naturalWidth === 0 )
		{
			return false;
		}

		const imageSrc = image.src;

		if( imageSrc === undefined || imageSrc === null )
		{
			return false;
		}

		if( imageSrc === fallbackCoverImage )
		{
			return true;
		}

		// Empty src is equal to the current location
		return imageSrc !== ""
			&& imageSrc !== window.location.href
			// Skip fallback cover from Steam CDN
			&& !imageSrc.includes( 'public/ssr' );
	}

	/**
	 * @param {number} appId
	 * @param {string} path
	 * @returns {string}
	 */
	function GetCoverUrl( appId, path )
	{
		return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/${path}?t=${Date.now()}`;
	}

	/**
	 * @param {number} appId
	 * @param {HTMLImageElement} img
	 */
	function StoreCoverImage( appId, img )
	{
		img.src = fallbackCoverImage;

		// Handle load error
		img.addEventListener( 'error', () =>
		{
			// Rollback
			img.src = fallbackCoverImage;
			appsImageStore.delete( appId );
		}, { once: true } );

		appsImageStore.set( appId, img );
	}

	function ParseGamePictureCovers()
	{
		const gamePictures = document.querySelectorAll( 'picture' );
		for( const picture of gamePictures )
		{
			const fiber = GetReactFiber( picture );
			if( !fiber )
			{
				continue;
			}

			const gameProps = fiber.return.memoizedProps?.game;
			if( !gameProps )
			{
				continue;
			}

			const appId = gameProps.appid;
			if( appsImageStore.has( appId ) )
			{
				continue;
			}

			const coverImg = picture.querySelector( 'img' );
			if( !coverImg )
			{
				continue;
			}

			if(  CheckValidImg( coverImg ) )
			{
				continue;
			}

			const spanPicture = picture.nextSibling;
			if( spanPicture instanceof HTMLSpanElement )
			{
				spanPicture.style.display = 'none';
			}

			StoreCoverImage( appId, coverImg );
		}
	}

	function ParseGameCoverCapsules()
	{
		/** @type {NodeListOf<HTMLImageElement>} */
		const gameCovers = document.querySelectorAll( 'img.game_capsule' );
		for( const cover of gameCovers )
		{
			if( CheckValidImg( cover ) )
			{
				continue;
			}

			const parent = cover.parentElement;
			if( parent instanceof HTMLAnchorElement )
			{
				const appId = GetAppIDFromUrl( parent.href );
				if( appsImageStore.has( appId ) )
				{
					continue;
				}

				StoreCoverImage( appId, cover );
			}
		}
	}

	async function LoadGameCovers()
	{
		if( appsImageStore.size === 0 )
		{
			return;
		}

		const appIds = Array.from( appsImageStore.keys() ).slice( 0, 50 );
		console.log( '[SteamDB]: Loading apps', appIds );

		// https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json={"ids":[{"appid":"654310"},{"appid":"1091500"},{"appid":"730"}],"context":{"country_code":"US"},"data_request":{"include_assets":true}}
		const url = new URL( 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/' );
		url.searchParams.set( 'input_json', JSON.stringify( {
			ids: appIds.slice( 0, 50 ).map( ( appid ) => ( { appid } ) ),
			context: {
				country_code: 'US',
			},
			data_request: {
				include_assets: true,
			},
		} ) );

		try
		{
			const req = await fetch( url , {
				headers: {
					'X-Requested-With': 'SteamDB',
				},
			} );

			const res = await req.json();

			for( const item of res.response.store_items )
			{
				const appImage = appsImageStore.get( item.appid );
				if( !appImage )
				{
					continue;
				}

				const headerAsset = item.assets?.header;
				if( headerAsset )
				{
					appImage.src = GetCoverUrl( item.appid, headerAsset );
				}
				else
				{
					appImage.src = GetCoverUrl( item.appid, 'header.jpg' );
				}

				appsImageStore.delete( item.appid );
			}
		}
		catch( err )
		{
			console.error( '[SteamDB]: Failed to load app', err );
		}
	}

	function InvokeParseCovers()
	{
		if( isGamesPage )
		{
			ParseGamePictureCovers();
		}
		else
		{
			ParseGameCoverCapsules();
		}

		LoadGameCovers();
	}

	InvokeParseCovers();

	setInterval( () =>
	{
		InvokeParseCovers();
	}, 10_000 );
} )();
