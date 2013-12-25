var link, element, container = document.getElementById( 'error_box' );

if( container )
{
	link = document.createElement( 'a' );
	link.className = 'steamdb_error_link';
	link.target = '_blank';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
	link.appendChild( document.createTextNode( 'View on Steam Database' ) );
	
	container.appendChild( link );
}
else
{
	container = document.querySelector( '#demo_block .block_content_inner' );
	
	if( container )
	{
		link = document.createElement( 'a' );
		link.className = 'game_area_wishlist_btn steamdb_button';
		link.target = '_blank';
		link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
		link.appendChild( document.createTextNode( 'View on Steam Database' ) );
		
		element = document.createElement( 'div' );
		element.className = 'demo_area_button';
		element.appendChild( link );
		
		container.insertBefore( element, container.firstChild );
	}
	
	// Find each "add to cart" button
	container = document.querySelectorAll( 'input[name="subid"]' );
	
	var hasDropdowns = false, i = 0, subid = 0, length = container.length;
	
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
				hasDropdowns = true;
				
				link = document.createElement( 'a' );
				link.className = 'steamdb_link' + ( element.querySelector( '.game_area_purchase_game_dropdown_left_panel' ) ? '' : ' steamdb_float_left' );
				link.target = '_blank';
				link.href = GetHomepage();
				link.innerHTML = 'View on Steam Database <i class="steamdb_subid">(nothing selected)</i>'; // TODO: fix
				
				element.appendChild( link );
			}
		}
		else
		{
			link = document.createElement( 'a' );
			link.className = 'steamdb_link steamdb_float_left';
			link.target = '_blank';
			link.href = GetHomepage() + 'sub/' + subid + '/';
			link.innerHTML = 'View on Steam Database <i class="steamdb_subid">(' + subid + ')</i>'; // TODO: fix
			
			element.appendChild( link );
		}
	}
	
	// We have to inject our JS directly into the page to hook Steam's functionatily
	if( hasDropdowns )
	{
		element = document.createElement( 'script' );
		element.id = 'steamdb_subscriptions_hook';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/store/subscriptions.js' );
		element.dataset.homepage = GetHomepage();
		
		document.head.appendChild( element );
	}
}
