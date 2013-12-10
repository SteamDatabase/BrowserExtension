var element, container = document.getElementById( 'error_box' );

if( container )
{
	container.insertAdjacentHTML( 'beforeEnd', '<br><br><a target="_blank" href="'+ GetHomepage() + 'app/' + GetCurrentAppID() + '/">View on Steam Database</a>' );
}
else
{
	container = document.querySelector( '#demo_block .block_content_inner' );
	
	if( container )
	{
		element = document.createElement( 'div' );
		element.className = 'demo_area_button';
		element.innerHTML = '<a class="game_area_wishlist_btn steamdb_button" target="_blank" href="' + GetHomepage() + 'app/' + GetCurrentAppID() + '/">View on Steam Database</a>';
		
		container.insertBefore( element, container.firstChild );
	}
	
	// Find each "add to cart" button
	container = document.querySelectorAll( 'input[name="subid"]' );
	
	var i = 0, subid = 0, length = container.length;
	
	for( i = 0; i < length; i++ )
	{
		element = container[ i ];
		
		subid = element.value;
		
		element = element.parentElement.parentElement;
		
		// Is this a subscription selector?
		if( subid.length === 0 )
		{
			if( element.querySelector( '.game_area_purchase_game_dropdown_selection' ) )
			{
				element.insertAdjacentHTML( 'beforeEnd', '<a class="steamdb_link' + ( element.querySelector( '.game_area_purchase_game_dropdown_left_panel' ) ? '' : ' steamdb_float_left' ) + '" target="_blank" href="'+ GetHomepage() + '">View on Steam Database <i class="steamdb_subid">(nothing selected)</i></a>' );
			}
		}
		else
		{
			element.insertAdjacentHTML( 'beforeEnd', '<a class="steamdb_link steamdb_float_left" target="_blank" href="'+ GetHomepage() + 'sub/' + subid + '/">View on Steam Database <i class="steamdb_subid">(' + subid + ')</i></a>' );
		}
	}
	
	// We have to inject our JS directly into the page to hook Steam's functionatily
	if( document.querySelector( '.game_area_purchase_game_dropdown_selection' ) )
	{
		element = document.createElement( 'script' );
		element.id = 'steamdb_subscriptions_hook';
		element.type = 'text/javascript';
		element.src = chrome.extension.getURL( 'scripts/store/subscriptions.js' ); // TODO: abstract
		element.dataset.homepage = GetHomepage();
		
		document.head.appendChild( element );
	}
}
