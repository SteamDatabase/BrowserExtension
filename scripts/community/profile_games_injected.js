( function()
{
	'use strict';

	if( document.body )
	{
		PerformHook();
	}
	else
	{
		const observer = new MutationObserver( function( mutations )
		{
			mutations.forEach( function( mutation )
			{
				if( !mutation.addedNodes )
				{
					return;
				}

				for( const node of mutation.addedNodes )
				{
					if( node.tagName === 'BODY' )
					{
						observer.disconnect();

						PerformHook();
					}
				}
			} );
		} );

		observer.observe( document, {
			childList: true,
			subtree: true,
		} );
	}

	function PerformHook()
	{
		// Set row logo exact image size so it does not reflow
		const style = document.createElement( 'style' );
		style.id = 'steamdb_fix_game_logo';
		style.appendChild( document.createTextNode( '@media screen and (min-width: 501px) { .gameListRowLogo img { width: 184px; height: 69px; } }' ) );
		document.head.appendChild( style );

		const script = document.getElementById( 'steamdb_profile_games' );
		const originalShowMenuCumulative = window.ShowMenuCumulative;
		const originalBuildGameRow = window.BuildGameRow;
		const popupsFragment = document.createDocumentFragment();
		const gameRowsFragment = document.createDocumentFragment();
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
						link.rel = 'noopener';
						link.className = 'popup_menu_item2 tight';
						link.href = script.dataset.homepage + 'app/' + appID + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
						link.appendChild( text );

						element.appendChild( link );
					}
				}
			}

			originalShowMenuCumulative.apply( this, arguments );
		};

		window.BuildGameRow = function SteamDB_FixedBuildGameRow()
		{
			if( !boundReady )
			{
				boundReady = true;

				window.$J( function()
				{
					// Do not append popups to DOM, because there's simply too many elements
					// Instead we will append to DOM on demand
					// document.body.append( popupsFragment );

					document.getElementById( 'games_list_rows' ).append( gameRowsFragment );

					for( const gameInfo of window.rgGames )
					{
						window.LoadImageGroupOnScroll( 'game_' + gameInfo.appid, 'game_logo_' + gameInfo.appid );
					}
				} );
			}

			window.$ = overridenPrototype;
			originalBuildGameRow.apply( this, arguments );
			window.$ = original$;
		};
	}
}() );
