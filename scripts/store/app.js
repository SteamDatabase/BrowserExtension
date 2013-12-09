var container = document.getElementById( 'error_box' );

if( container )
{
	container.insertAdjacentHTML( 'beforeEnd', '<br><br><a target="_blank" href="'+ GetHomepage() + 'app/' + GetCurrentAppID() + '/">View on Steam Database</a>' );
	
	return;
}

container = document.querySelector( '#demo_block .block_content_inner' );

if( !container )
{
	return;
}

element = document.createElement( 'div' );
element.className = 'demo_area_button';
element.innerHTML = '<a class="game_area_wishlist_btn steamdb_button" target="_blank" href="' + GetHomepage() + 'app/' + GetCurrentAppID() + '/">View on Steam Database</a>';

container.insertBefore( element, container.firstChild );

// Find each "add to cart" button
container = document.querySelectorAll( 'input[name="subid"]' );

var i = 0, appid = 0;

for( i = 0; i < container.length; i++ )
{
	element = container[ i ];
	
	appid = element.value; // It's subid, but let's reuse things
	
	element = element.parentElement.parentElement;
	
	element.insertAdjacentHTML( 'beforeEnd', '<a class="steamdb_sub_link" target="_blank" href="'+ GetHomepage() + 'sub/' + appid + '/" style="' + ( element.querySelector( '.game_area_purchase_game_dropdown_left_panel' ) ? '' : 'float:left;' ) + 'color:#898A8C">View on Steam Database <i>(' + appid + ')</i></a>' );
}

if( !document.querySelector( '.game_area_purchase_game_dropdown_selection' ) )
{
	// There are no dropdowns, so don't bother hooking
	return;
}

/*element = document.createElement( 'script' );
element.id = 'steamdb_dropdown_hook';
element.type = 'text/javascript'; 
element.appendChild( document.createTextNode( '(' + SteamDB.InjectAppSubscriptions + ')();' ) );

document.head.appendChild( element );
*/