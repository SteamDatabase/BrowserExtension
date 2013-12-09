var container = document.querySelector( '.game_details .block_content_inner' );

if( container )
{
	var element = document.createElement( 'div' );
	element.innerHTML = '<a class="game_area_wishlist_btn steamdb_button" target="_blank" href="' + GetHomepage() + 'app/' + GetCurrentAppID() + '/">View on Steam Database</a>';
	
	container.insertBefore( element, null );
}
