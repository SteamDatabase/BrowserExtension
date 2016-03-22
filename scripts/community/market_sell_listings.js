'use strict';

GetOption( { 'partially-show-market-sell-listings': true }, function( items )
{
	if( items[ 'partially-show-market-sell-listings' ] )
	{
		var element = document.getElementById( 'tabContentsMyListings' );

		if ( element )
		{
			var marketOrderTypes = element.querySelectorAll( '.my_listing_section.market_content_block.market_home_listing_table' );

			for ( var i = 0; i < marketOrderTypes.length; i++ )
			{
				var listingCount = marketOrderTypes[i].querySelectorAll( '.market_listing_row.market_recent_listing_row' ).length;

				if ( listingCount <= 5 )
				{
					continue;
				}

				marketOrderTypes[i].classList.add( 'steamdb_listing_partial' );

				marketOrderTypes[i].classList.add( 'steamdb_list' + i );

				var showMore = document.createElement( 'div' );
				showMore.className = 'market_listing_table_showmore steamdb_listings_showmore';
				showMore.dataset.referenceId = i;
				marketOrderTypes[i].parentNode.insertBefore( showMore, marketOrderTypes[i].nextSibling );

				var btn = document.createElement( 'span' );
				btn.className = 'btnv6_blue_hoverfade btn_medium';
				showMore.appendChild( btn );

				var btnText = document.createElement( 'span' );
				btnText.textContent = 'Show all';
				btn.appendChild(btnText);

				showMore.addEventListener( 'click', function(e) {
					e.preventDefault();

					var el = document.querySelector( '.steamdb_list' + this.dataset.referenceId );

					if ( el ) {
						if ( el.classList.contains( 'steamdb_listing_partial' ) )
						{
							el.classList.remove( 'steamdb_listing_partial' );
							this.querySelector( 'span > span' ).textContent = 'Hide all';
						}
						else {
							el.classList.add( 'steamdb_listing_partial' );
							this.querySelector( 'span > span' ).textContent = 'Show all';
						}
					}
				});
			}
		}
	}
} );
