GetOption( { 'button-sub': true }, function( items )
{
	if( !items[ 'button-sub' ] )
	{
		return;
	}
	
	var container = document.querySelector( '.game_meta_data' );
	
	if( container )
	{
		var element = document.createElement( 'span' );
		element.appendChild( document.createTextNode( 'View on Steam Database' ) );
		
		var link = document.createElement( 'a' );
		link.className = 'action_btn';
		link.target = '_blank';
		link.href = GetHomepage() + 'sub/' + GetCurrentAppID() + '/';
		link.appendChild( element );
		
		element = document.createElement( 'div' );
		element.className = 'block';
		element.appendChild( link );
		
		container.insertBefore( element, container.firstChild );
	}
} );
