'use strict';

( ( () =>
{
	let steamdb_familyOwned;
	const scriptHook = document.getElementById( 'steamdb_family_shared' );
	const i18n = JSON.parse( scriptHook.dataset.i18n );

	if( !window.GDynamicStore || !window.GDynamicStore.DecorateDynamicItems )
	{
		return;
	}

	window.HandleFamilyOwned = function SteamDB_HandleFamilyOwned()
	{
		if( !steamdb_familyOwned )
		{
			return;
		}

		// if we're on a react page
		// i have the feeling that this is a poor way to detect this
		// and it won't survive the react-ification of the wishlist page
		if( document.querySelector( '.react_landing_background' ) )
		{
			[ ...document.getElementsByTagName( 'a' ) ].forEach(
				( link ) =>
				{
					if( !link.href.startsWith( 'https://store.steampowered.com/app/' ) )
					{
						return;
					}
					// this isn't a react element (search on react page)
					if( link.getAttribute( 'data-ds-appid' ) )
					{
						return;
					}
					if( !link.getElementsByTagName( 'img' )?.length )
					{
						return;
					}
					const appid = link.href.split( '/' )[ 4 ];
					if( !appid ||  !steamdb_familyOwned?.rgFamilySharedApps [ appid ]  )
					{
						return;
					}
					let caps_decorator = link.querySelector( '.CapsuleDecorators' );
					// Steam doesn't create that element in some cases (Today's Deal!) but we don't care
					if( !caps_decorator )
					{
						caps_decorator = document.createElement( 'div' );
						caps_decorator.classList.add( 'CapsuleDecorators', "steamdb_fake_capsule_decorator" );
						link.prepend( caps_decorator );
					}

					// if it has a children there already a flag, we don't want to touch it
					// TODO: maybe partialy override the wishlist flag to make it visible it's in your family (change the color?)
					if( caps_decorator.childElementCount )
					{
						return;
					}
					const element = document.createElement( 'span' );
					element.classList.add( 'steamdb_fake_span' );
					const img = document.createElement( 'img' );
					img.src = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJub25lIj48cGF0aCBkPSJNNy44MTk5OCAxNS4zMzMzQzYuMjM0OSAxNi40Mjk4IDUuMTQ1MjEgMTguMTA2MiA0Ljc4NjY1IDIwSDEuMzMzMzFWMTUuMzMzM0MxLjMzMzMxIDE0LjA5NTYgMS44MjQ5OCAxMi45MDg2IDIuNzAwMTUgMTIuMDMzNUMzLjU3NTMyIDExLjE1ODMgNC43NjIzIDEwLjY2NjYgNS45OTk5OCAxMC42NjY2QzYuMjc0OTIgMTAuNjY3MyA2LjU0OTI5IDEwLjY5MTggNi44MTk5OCAxMC43NEM2LjcxNTA4IDExLjE2MyA2LjY2MzU3IDExLjU5NzUgNi42NjY2NSAxMi4wMzMzQzYuNjY5NDQgMTMuMjMxNiA3LjA3NTcyIDE0LjM5NDEgNy44MTk5OCAxNS4zMzMzWk01Ljk5OTk4IDguNjk5OTVDNi41OTMzMiA4LjY5OTk1IDcuMTczMzQgOC41MjQwMSA3LjY2NjY5IDguMTk0MzZDOC4xNjAwNCA3Ljg2NDcyIDguNTQ0NTYgNy4zOTYxOCA4Ljc3MTYyIDYuODQ4QzguOTk4NjggNi4yOTk4MiA5LjA1ODA5IDUuNjk2NjIgOC45NDIzNCA1LjExNDY4QzguODI2NTggNC41MzI3NCA4LjU0MDg2IDMuOTk4MTkgOC4xMjEzIDMuNTc4NjNDNy43MDE3NCAzLjE1OTA3IDcuMTY3MTkgMi44NzMzNSA2LjU4NTI1IDIuNzU3NkM2LjAwMzMxIDIuNjQxODQgNS40MDAxMSAyLjcwMTI1IDQuODUxOTMgMi45MjgzMUM0LjMwMzc1IDMuMTU1MzggMy44MzUyMiAzLjUzOTg5IDMuNTA1NTcgNC4wMzMyNEMzLjE3NTkzIDQuNTI2NTkgMi45OTk5OCA1LjEwNjYxIDIuOTk5OTggNS42OTk5NUMyLjk5OTEgNi4wOTQxNiAzLjA3NjEgNi40ODQ2NyAzLjIyNjU1IDYuODQ5MDRDMy4zNzcgNy4yMTM0MiAzLjU5Nzk1IDcuNTQ0NDggMy44NzY3IDcuODIzMjNDNC4xNTU0NSA4LjEwMTk4IDQuNDg2NTIgOC4zMjI5MyA0Ljg1MDg5IDguNDczMzhDNS4yMTUyNiA4LjYyMzgzIDUuNjA1NzcgOC43MDA4MyA1Ljk5OTk4IDguNjk5OTVaTTE4IDguNjk5OTVDMTguNTkzMyA4LjY5OTk1IDE5LjE3MzMgOC41MjQwMSAxOS42NjY3IDguMTk0MzZDMjAuMTYgNy44NjQ3MiAyMC41NDQ2IDcuMzk2MTggMjAuNzcxNiA2Ljg0OEMyMC45OTg3IDYuMjk5ODIgMjEuMDU4MSA1LjY5NjYyIDIwLjk0MjMgNS4xMTQ2OEMyMC44MjY2IDQuNTMyNzQgMjAuNTQwOSAzLjk5ODE5IDIwLjEyMTMgMy41Nzg2M0MxOS43MDE3IDMuMTU5MDcgMTkuMTY3MiAyLjg3MzM1IDE4LjU4NTMgMi43NTc2QzE4LjAwMzMgMi42NDE4NCAxNy40MDAxIDIuNzAxMjUgMTYuODUxOSAyLjkyODMxQzE2LjMwMzggMy4xNTUzOCAxNS44MzUyIDMuNTM5ODkgMTUuNTA1NiA0LjAzMzI0QzE1LjE3NTkgNC41MjY1OSAxNSA1LjEwNjYxIDE1IDUuNjk5OTVDMTQuOTk5MSA2LjA5NDE2IDE1LjA3NjEgNi40ODQ2NyAxNS4yMjY2IDYuODQ5MDRDMTUuMzc3IDcuMjEzNDIgMTUuNTk3OSA3LjU0NDQ4IDE1Ljg3NjcgNy44MjMyM0MxNi4xNTU0IDguMTAxOTggMTYuNDg2NSA4LjMyMjkzIDE2Ljg1MDkgOC40NzMzOEMxNy4yMTUzIDguNjIzODMgMTcuNjA1OCA4LjcwMDgzIDE4IDguNjk5OTVaTTIxLjMzMzMgMTIuMDY2NkMyMC44OTYgMTEuNjI5MyAyMC4zNzYxIDExLjI4MzMgMTkuODAzOCAxMS4wNDg3QzE5LjIzMTYgMTAuODE0IDE4LjYxODQgMTAuNjk1NSAxOCAxMC43QzE3LjcyNSAxMC43MDA2IDE3LjQ1MDcgMTAuNzI1MSAxNy4xOCAxMC43NzMzQzE3LjI4MjIgMTEuMTg1NSAxNy4zMzM2IDExLjYwODYgMTcuMzMzMyAxMi4wMzMzQzE3LjMzOCAxMy4yNDMgMTYuOTMxMyAxNC40MTg1IDE2LjE4IDE1LjM2NjZDMTcuNzY1MSAxNi40NjMxIDE4Ljg1NDcgMTguMTM5NiAxOS4yMTMzIDIwLjAzMzNIMjIuNjY2NlYxNS4zNjY2QzIyLjY3NTYgMTQuMTMzNyAyMi4xOTYzIDEyLjk0NzMgMjEuMzMzMyAxMi4wNjY2WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+PHBhdGggZD0iTTEyIDE0LjdDMTIuNTI3NCAxNC43IDEzLjA0MyAxNC41NDM2IDEzLjQ4MTUgMTQuMjUwNkMxMy45MiAxMy45NTc2IDE0LjI2MTggMTMuNTQxMSAxNC40NjM3IDEzLjA1MzlDMTQuNjY1NSAxMi41NjY2IDE0LjcxODMgMTIuMDMwNCAxNC42MTU0IDExLjUxMzFDMTQuNTEyNSAxMC45OTU4IDE0LjI1ODUgMTAuNTIwNyAxMy44ODU2IDEwLjE0NzdDMTMuNTEyNyA5Ljc3NDgxIDEzLjAzNzUgOS41MjA4MyAxMi41MjAyIDkuNDE3OTRDMTIuMDAyOSA5LjMxNTA1IDExLjQ2NjggOS4zNjc4NSAxMC45Nzk1IDkuNTY5NjlDMTAuNDkyMiA5Ljc3MTUyIDEwLjA3NTcgMTAuMTEzMyA5Ljc4MjczIDEwLjU1MThDOS40ODk3MSAxMC45OTA0IDkuMzMzMzEgMTEuNTA1OSA5LjMzMzMxIDEyLjAzMzRDOS4zMzMzMSAxMi43NDA2IDkuNjE0MjYgMTMuNDE4OSAxMC4xMTQ0IDEzLjkxOUMxMC42MTQ1IDE0LjQxOTEgMTEuMjkyNyAxNC43IDEyIDE0LjdaTTEyIDE2LjdDMTAuNzYyMyAxNi43IDkuNTc1MzIgMTcuMTkxNyA4LjcwMDE1IDE4LjA2NjlDNy44MjQ5OCAxOC45NDIgNy4zMzMzMSAyMC4xMjkgNy4zMzMzMSAyMS4zNjY3SDE2LjY2NjZDMTYuNjY2NiAyMC4xMjkgMTYuMTc1IDE4Ljk0MiAxNS4yOTk4IDE4LjA2NjlDMTQuNDI0NiAxNy4xOTE3IDEzLjIzNzcgMTYuNyAxMiAxNi43WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+PC9zdmc+';
					element.append( img, i18n.in_family );
					caps_decorator.appendChild( element );
				}
			);
		}
		else if( document.location.href.startsWith( 'https://store.steampowered.com/wishlist/' ) )
		{
			// we might need to handle bForceRecalculate, but i don't think it's ever set on the wishlist
			[ ...document.getElementsByClassName( 'wishlist_row' ) ].forEach(
				( div ) =>
				{
					if( div.getAttribute( 'data-app-id' ) && steamdb_familyOwned?.rgFamilySharedApps [ div.getAttribute( 'data-app-id' ) ] )
					{
						div.classList.add( 'ds_flagged' , 'ds_owned' );
						const element = document.createElement( 'div' );
						element.classList.add( 'steamdb_ds_family_owned_flag', 'ds_flag' );
						element.innerHTML = `${i18n.in_family}&nbsp;&nbsp;`;
						div.querySelector( '.capsule' ).appendChild( element );
					}
				}
			);
		}
		// we always need to run this since search results needs it & are on react pages
		// sucks that we can't grab all elements that have a given attribute (data-app-id) (querySelectorAll gives static elements)
		// Maybe Array.from() is cleaner?
		[ ...document.getElementsByTagName( 'a' ) ].forEach(
			( link ) =>
			{
				if( link.classList.contains( 'ds_no_flags' ) || link.classList.contains( 'ds_owned' ) || link.classList.contains( 'ds_wishlist' ) )
				{
					return;
				}
				// we don't need to remove anything when bForceRecalculate is true since base DecorateDynamicItems already does
				if( link.getAttribute( 'data-ds-appid' ) && steamdb_familyOwned?.rgFamilySharedApps [ link.getAttribute( 'data-ds-appid' ) ] )
				{
					link.classList.add( 'ds_flagged' , 'ds_owned' );
					const element = document.createElement( 'div' );
					element.classList.add( 'steamdb_ds_family_owned_flag', 'ds_flag' );
					element.innerHTML = `${i18n.in_family}&nbsp;&nbsp;`;
					link.appendChild( element );
				}
			} );
	};

	const originalGDynamicStoreDecorateDynamicItems = window.GDynamicStore.DecorateDynamicItems;

	window.GDynamicStore.DecorateDynamicItems = function SteamDB_GDynamicStore_DecorateDynamicItems()
	{
		originalGDynamicStoreDecorateDynamicItems.apply( this, arguments );

		window.HandleFamilyOwned();
	};

	window.addEventListener( 'message', ( request ) =>
	{
		if( request?.data && request.data.type === 'steamdb:user-family-data-processed' )
		{
			steamdb_familyOwned = request?.data.data;
			window.HandleFamilyOwned();
		}
	} );

	if( document.querySelector( '.react_landing_background' ) )
	{
		// https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes
		// modified with a weird debounce that fires on the first call & 5000ms after the last call
		let timer;
		const handleDebounced = () =>
		{
			if( !timer )
			{
				setTimeout( window.HandleFamilyOwned, 500 );
			}
			clearTimeout( timer );
			timer = setTimeout( () =>
			{
				window.HandleFamilyOwned();
				timer = null;
			}, 5000 );
		};

		let oldHref = document.location.href;
		const body = document.querySelector( 'body' );
		const observer = new MutationObserver( mutations =>
		{
			if( oldHref !== document.location.href )
			{
				oldHref = document.location.href;
				handleDebounced();
			}
		}
		);
		observer.observe( body, { childList: true, subtree: true } );

		// look for button clicks (Show More)
		document.addEventListener( 'click', ( e ) =>
		{
			if( !e?.target?.closest( 'button' ) )
			{
				return;
			}
			handleDebounced();
		} );
	}
} )() );

