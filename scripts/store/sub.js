var container = document.querySelector( '.share' );

if( !container )
{
	return;
}

var element = document.createElement( 'div' );
element.className = 'demo_area_button';
element.innerHTML = '<a class="game_area_wishlist_btn steamdb_button" target="_blank" href="' + GetHomepage() + 'sub/' + GetCurrentAppID() + '/">View on Steam Database</a>';

container.insertBefore( element, container.firstChild );
