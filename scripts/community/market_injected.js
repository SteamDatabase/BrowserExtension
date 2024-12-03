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
	if( window.CAjaxPagingControls )
	{
		const originalGoToPage = window.CAjaxPagingControls.prototype.GoToPage;
		const originalOnAJAXComplete = window.CAjaxPagingControls.prototype.OnAJAXComplete;
		const originalOnResponseRenderResults = window.CAjaxPagingControls.prototype.OnResponseRenderResults;

		const loader = document.createElement( 'div' );
		loader.className = 'steamdb_market_loader';
		loader.hidden = true;

		const summary = document.getElementById( 'searchResultsTable' );

		if( summary )
		{
			summary.append( loader );
		}

		window.CAjaxPagingControls.prototype.OnResponseRenderResults = function SteamDB_OnResponseRenderResults( transport )
		{
			const response = transport.responseJSON;

			if( !response )
			{
				// Call original but it does nothing for no success
				originalOnResponseRenderResults.apply( this, arguments );
				return;
			}

			const responseStart = response.start;
			let fixedBug = false;

			if( response.success && responseStart > 0 && response.total_count < 1 )
			{
				fixedBug = true;
				response.start = 0;

				console.log( '[SteamDB] Steam returned 0 results, but user was trying to load a page, fixing this' );
			}

			originalOnResponseRenderResults.apply( this, arguments );

			if( fixedBug )
			{
				// If user tries to fetch some page, but Steam says there are no results and returns an error html,
				// it normally screws the state of the pagination
				this.m_iCurrentPage = Math.floor( responseStart / this.m_cPageSize );
				this.m_cMaxPages = this.m_iCurrentPage + 1;
			}
		};

		window.CAjaxPagingControls.prototype.GoToPage = function SteamDB_GoToPage( iPage )
		{
			if( this.m_strElementPrefix !== 'searchResults' )
			{
				originalGoToPage.apply( this, arguments );
				return;
			}

			// If initial page load has no count, but somehow is trying to go to a page,
			// force the page check to pass otherwise it will not try to load anything
			if( window.g_oSearchData && window.g_oSearchData.total_count < 1 && this.m_cMaxPages < 1 )
			{
				this.m_cMaxPages = iPage + 1;

				console.log( '[SteamDB] Page loaded with 0 results, fixing this' );
			}

			originalGoToPage.apply( this, arguments );

			if( this.m_bLoading )
			{
				loader.hidden = false;
			}
		};

		window.CAjaxPagingControls.prototype.OnAJAXComplete = function( transport )
		{
			originalOnAJAXComplete.apply( this, arguments );

			if( this.m_strElementPrefix !== 'searchResults' )
			{
				return;
			}

			loader.hidden = true;

			AddRetryMarketButton( this );

			// If the request fail, cache bust future requests, otherwise retrying will just hit browser cache
			if( !transport.responseJSON || !transport.responseJSON.success || transport.responseJSON.total_count < 1 )
			{
				if( this.m_rgStaticParams === null )
				{
					this.m_rgStaticParams = {};
				}

				this.m_rgStaticParams.steamdb_cache = Date.now().toString();
			}
		};
	}

	function AddRetryMarketButton( context )
	{
		const message = document.querySelector( '#searchResultsTable .market_listing_table_message' );

		if( !message )
		{
			return;
		}

		const div = document.createElement( 'div' );
		div.className = 'steamdb_market_retry_button';

		const btn = document.createElement( 'button' );
		btn.className = 'btnv6_green_white_innerfade btn_medium';

		const span = document.createElement( 'span' );
		span.textContent = 'Try again';
		btn.append( span );

		btn.addEventListener( 'click', () =>
		{
			btn.remove();
			context.GoToPage( context.m_iCurrentPage, true );
		} );

		div.append( btn );
		message.append( div );
	}

	setTimeout( () =>
	{
		if( window.g_oSearchResults )
		{
			AddRetryMarketButton( window.g_oSearchResults );
		}
	}, 100 );
}
