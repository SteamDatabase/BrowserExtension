( function()
{
	'use strict';

	if( document.body )
	{
		PerformHook();
	}
	else
	{
		// If the script was injected too early, wait for <body> element to be created
		const observer = new MutationObserver( () =>
		{
			// Simply check whether body exists yet,
			// not using mutation.addedNodes to prevent any possible race conditions
			if( document.body )
			{
				PerformHook();

				observer.disconnect();
			}
		} );

		observer.observe( document, {
			childList: true,
			subtree: true,
		} );
	}

	function PerformHook()
	{
		// If the page errored out, don't do anything
		if( !( 'BuildGameRow' in window ) )
		{
			return;
		}

		// Set row logo exact image size so it does not reflow
		const style = document.createElement( 'style' );
		style.id = 'steamdb_fix_game_logo';
		style.appendChild( document.createTextNode(
			'.steamdb_optimizing { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; background: #417B9C; color: #fff; padding: 8px 16px; border-radius: 20px; }' +
			'@media screen and (min-width: 501px) { .gameListRowLogo img { width: 184px; height: 69px; } }',
		) );
		document.head.appendChild( style );

		const script = document.getElementById( 'steamdb_profile_games' );
		const originalBuildGameRow = window.BuildGameRow;
		const popupsFragment = document.createDocumentFragment();
		const gameRowsFragment = document.createDocumentFragment();
		const hookedLazyLoadCalls = [];
		let boundReady = false;

		const original$ = window.$;
		const overridenPrototype = function SteamDB_OverridenPrototype( a )
		{
			if( a === 'games_list_rows' )
			{
				return gameRowsFragment;
			}
			else if( a === document.body )
			{
				return popupsFragment;
			}

			return original$.apply( this, arguments );
		};

		const optimizingElement = document.createElement( 'div' );
		optimizingElement.className = 'steamdb_optimizing';
		optimizingElement.appendChild( document.createTextNode( script.dataset.steamdb_is_optimizing ) );
		document.body.append( optimizingElement );

		const FirstBuildCallback = () =>
		{
			const originalShowMenuCumulative = window.ShowMenuCumulative;
			window.ShowMenuCumulative = function SteamDB_DynamicShowMenuCumulative( elemLink, elemPopup )
			{
				if( !document.getElementById( elemPopup ) )
				{
					const popup = popupsFragment.getElementById( elemPopup );
					document.body.append( popup );

					if( elemPopup.startsWith( 'links_dropdown_' ) )
					{
						const appID = elemPopup.replace( 'links_dropdown_', '' );
						const element = popup.querySelector( '.popup_body2' );

						if( element )
						{
							const text = document.createElement( 'h5' );
							text.appendChild( document.createTextNode( script.dataset.view_on_steamdb ) );

							const link = document.createElement( 'a' );
							link.className = 'popup_menu_item2 tight';
							link.href = script.dataset.homepage + 'app/' + appID + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
							link.appendChild( text );

							element.appendChild( link );
							
							const text2 = document.createElement( 'h5' );
							text2.appendChild( document.createTextNode( script.dataset.view_on_pcgamingwiki ) );

							const link2 = document.createElement( 'a' );
							link2.className = 'popup_menu_item2 tight';
							link2.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + appID + '&utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
							link2.appendChild( text2 );

							element.appendChild( link2 );
						}
					}
				}

				originalShowMenuCumulative.apply( this, arguments );
			};

			const originalLoadImageGroupOnScroll = window.LoadImageGroupOnScroll;
			window.LoadImageGroupOnScroll = function SteamDB_LoadImageGroupOnScroll()
			{
				hookedLazyLoadCalls.push( arguments );
			};

			// Override $ (prototype.js) to catch when Valve appends popups and game rows to DOM
			window.$ = overridenPrototype;

			// Using $J here to get a callback after Steam's own callback finishes,
			// the one that calls BuildGameRow in a loop
			window.$J( () =>
			{
				window.$ = original$;
				window.BuildGameRow = originalBuildGameRow;
				window.LoadImageGroupOnScroll = originalLoadImageGroupOnScroll;

				// Do not append popups to DOM, because there's simply too many elements
				// Instead we will append to DOM on demand
				// document.body.append( popupsFragment );

				document.getElementById( 'games_list_rows' ).append( gameRowsFragment );

				for( const hooked of hookedLazyLoadCalls )
				{
					originalLoadImageGroupOnScroll( ...hooked );
				}

				optimizingElement.remove();
			} );
		};

		window.BuildGameRow = function SteamDB_FixedBuildGameRow()
		{
			// To prevent any timing issues, simply wait for the first call to BuildGameRow to perform setup
			if( !boundReady )
			{
				boundReady = true;

				FirstBuildCallback();
			}

			originalBuildGameRow.apply( this, arguments );
		};

		// Fix valve's bug with updating game rows not loading app logo
		const originalUpdateGameRow = window.UpdateGameRow;

		window.UpdateGameRow = function SteamDB_UpdateGameRow( gameInfo )
		{
			originalUpdateGameRow.apply( this, arguments );

			const logo = document.getElementById( `delayedimage_game_logo_${gameInfo.appid}_0` );

			if( logo )
			{
				logo.src = gameInfo.logo;
			}
		};
	}
}() );
