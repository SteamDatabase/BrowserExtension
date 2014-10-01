// There's no easier way to check if we're on error page :(
if( document.title === 'Sorry!' || document.title === 'Error' )
{
	var link = document.createElement( 'a' );
	link.href = 'http://steamstat.us';
	link.target = '_blank';
	link.appendChild( document.createTextNode( 'View network status on SteamDB' ) );
	
	var element = document.createElement( 'div' );
	element.className = 'steamdb_downtime_container';
	element.appendChild( document.createTextNode( 'Steam appears to be experiencing some downtime. ' ) );
	element.appendChild( link );
	
	var container = document.createElement( 'div' );
	container.className = 'steamdb_downtime';
	container.appendChild( element );
	
	document.body.insertBefore( container, document.body.firstChild );
	
	document.body.style.margin = 0;
}
else
{
	GetOption( [ 'enhancement-hide-install-button' ], function( items )
	{
		if( items[ 'enhancement-hide-install-button' ] === false )
		{
			var element = document.querySelector( '.header_installsteam_btn' );
			
			if( element )
			{
				element.setAttribute( 'hidden', true );
			}
		}
	} );
}
