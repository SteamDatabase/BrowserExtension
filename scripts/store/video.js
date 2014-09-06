GetOption( 'button-video', function( items )
{
	if( items[ 'button-video' ] === true )
	{
		return;
	}
	
	var container = document.querySelector( '.game_details .block_content_inner' );
	
	if( container )
	{
		var link = document.createElement( 'a' );
		link.style.backgroundImage = 'url("' + GetLocalResource( 'images/store.png' ) + '")';
		link.className = 'game_area_wishlist_btn steamdb_button';
		link.target = '_blank';
		link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
		link.appendChild( document.createTextNode( 'View on Steam Database' ) );
		
		container.insertBefore( link, null );
	}
} );
