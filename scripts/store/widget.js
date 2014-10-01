GetOption( { 'link-subid-widget': true }, function( items )
{
	if( !items[ 'link-subid-widget' ] )
	{
		return;
	}
	
	var subid = document.querySelector( 'input[name="subid"]' );

	if( subid )
	{
		var subid = subid.value;
		
		var subidElement = document.createElement( 'i' );
		subidElement.className = 'steamdb_subid';
		subidElement.appendChild( document.createTextNode( '(' + subid + ')' ) );
		
		var link = document.createElement( 'a' );
		link.className = 'steamdb_link';
		link.target = '_blank';
		link.href = GetHomepage() + 'sub/' + subid + '/';
		link.appendChild( document.createTextNode( 'View on Steam Database ' ) );
		link.appendChild( subidElement );
		
		var container = document.createElement( 'p' );
		container.appendChild( link );
		
		document.querySelector( '.desc' ).appendChild( container );
	}
});
