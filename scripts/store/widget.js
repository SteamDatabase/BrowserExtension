GetOption( [ 'link-subid-widget' ], function( items )
{
	if( items[ 'link-subid-widget' ] === true )
	{
		return;
	}
	
	var subid = document.querySelector( 'input[name="subid"]' );

	if( subid )
	{
		var subid = subid.value;
		
		var link = document.createElement( 'a' );
		link.className = 'steamdb_link';
		link.target = '_blank';
		link.href = GetHomepage() + 'sub/' + subid + '/';
		link.innerHTML = 'View on Steam Database <i class="steamdb_subid">(' + subid + ')</i>'; // TODO: fix
		
		var container = document.createElement( 'p' );
		container.appendChild( link );
		
		document.querySelector( '.desc' ).appendChild( container );
	}
});
