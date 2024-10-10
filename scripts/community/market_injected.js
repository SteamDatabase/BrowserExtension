'use strict';

// If prototype.js already loaded, use its event
if( 'observe' in Event )
{
	Event.observe( document, 'dom:loaded', OnLoaded );
}
else
{
	document.addEventListener( 'DOMContentLoaded', OnLoaded );
}

function OnLoaded()
{
	console.log( 'event', window.g_oSearchResults == undefined, CAjaxPagingControls );

	if( !window.CAjaxPagingControls )
	{
		return;
	}

	const savedPageSize = Number( localStorage.getItem( 'steamdb_market_page_size' ) );
	const originalCAjaxPagingControls = window.CAjaxPagingControls.prototype.UpdatePagingDisplay;
	const originalGoToPage = window.CAjaxPagingControls.prototype.GoToPage;
	const originalOnAJAXComplete = window.CAjaxPagingControls.prototype.OnAJAXComplete;

	const loader = document.createElement( 'div' );
	loader.className = 'steamdb_market_loader';
	loader.hidden = true;

	const loaderWarning = document.createElement( 'div' );
	loaderWarning.className = 'steamdb_market_error';
	loaderWarning.textContent = '⚠️';
	loaderWarning.hidden = true;

	window.CAjaxPagingControls.prototype.UpdatePagingDisplay = function SteamDB_CAjaxPagingControls( )
	{
		if( this.m_strElementPrefix !== 'searchResults' )
		{
			originalCAjaxPagingControls.apply( this, arguments );
			return;
		}

		if( savedPageSize > 10 && savedPageSize <= 100 )
		{
			this.m_cPageSize = savedPageSize;

			setTimeout( () =>
			{
				this.GoToPage( 0, true );
			}, 10 );
		}

		try
		{
			const pageSizes = [ 10, 25, 50, 100 ];

			const pagerContainer = document.createElement( 'div' );
			pagerContainer.className = 'steamdb_market_per_page';

			for( const pageSize of pageSizes )
			{
				const link = document.createElement( 'a' );
				link.href = '#';
				link.textContent = pageSize.toString();
				link.dataset.size = pageSize.toString();
				link.addEventListener( 'click', ( e ) =>
				{
					e.preventDefault();

					this.m_cPageSize = pageSize;
					this.GoToPage( 0, true );

					const oldLink = pagerContainer.querySelector( 'a.disabled' );

					if( oldLink )
					{
						oldLink.classList.remove( 'disabled' );
					}

					link.classList.add( 'disabled' );

					localStorage.setItem( 'steamdb_market_page_size', pageSize );
				} );

				if( pageSize === this.m_cPageSize )
				{
					link.classList.add( 'disabled' );
				}

				pagerContainer.append( link );
			}

			pagerContainer.append( loader );
			pagerContainer.append( loaderWarning );

			const container = document.getElementById( `${this.m_strElementPrefix}_ctn` );
			container.append( pagerContainer );
		}
		catch( e )
		{
			console.error( '[SteamDB]', e );
		}

		originalCAjaxPagingControls.apply( this, arguments );

		window.CAjaxPagingControls.prototype.UpdatePagingDisplay = originalCAjaxPagingControls;
	};


	window.CAjaxPagingControls.prototype.GoToPage = function SteamDB_GoToPage()
	{
		originalGoToPage.apply( this, arguments );

		loaderWarning.hidden = true;

		if( this.m_bLoading )
		{
			loader.hidden = false;
		}
	};

	window.CAjaxPagingControls.prototype.OnAJAXComplete = function( transport )
	{
		originalOnAJAXComplete.apply( this, arguments );

		loader.hidden = true;

		// If the request fail, cache bust future requests, otherwise retrying will just hit browser cache
		if( !transport.responseJSON?.success )
		{
			this.m_rgStaticParams.steamdb_cache = Date.now().toString();
			loaderWarning.hidden = false;
		}
	};

	if( !window.g_oSearchResults )
	{
		return;
	}

	const search = window.g_oSearchResults;
	const originalOnResponseRenderResults = search.OnResponseRenderResults;

	// TODO: Maybe use OnAJAXComplete instead
	search.OnResponseRenderResults = function SteamDB_OnResponseRenderResults( transport )
	{
		originalOnResponseRenderResults.apply( this, arguments );

		try
		{
			const prefix = search.m_strElementPrefix;

			const rows = document.querySelector( `${prefix}Rows` );
		}
		catch( e )
		{
			console.error( '[SteamDB]', e );
		}
	};

	const originalAddItemHoverToElement = window.AddItemHoverToElement;

	window.AddItemHoverToElement = function SteamDB_AddItemHoverToElement( element, rgItem )
	{
		originalAddItemHoverToElement.apply( this, arguments );

		try
		{
			console.log( element, rgItem );
		}
		catch( e )
		{
			console.error( '[SteamDB]', e );
		}
	};

}
