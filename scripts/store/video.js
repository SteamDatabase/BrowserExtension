GetOption( [ 'button-video' ], function( items )
{
	if( items[ 'button-video' ] === true )
	{
		return;
	}
	
	var container = document.querySelector( '.game_details .block_content_inner' );
	
	if( container )
	{
		var link = document.createElement( 'a' );
		link.className = 'action_btn';
		link.target = '_blank';
		link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
		link.appendChild( document.createTextNode( 'View on Steam Database' ) );
		
		container.insertBefore( link, null );
	}
} );
