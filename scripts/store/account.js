var licenses = document.querySelectorAll( '.licenseRow p' ),
    link,
    title,
    element;

if( licenses )
{
	for( var i = 0, length = licenses.length; i < length; i++ )
	{
		element = licenses[ i ];
		title = element.textContent;
		
		link = document.createElement( 'a' );
		link.className = 'steamdb_button';
		link.target = '_blank';
		link.href = GetHomepage() + 'search/?a=sub&q=' + encodeURIComponent( title );
		link.appendChild( document.createTextNode( title ) );
		
		element.parentNode.replaceChild( link, element );
	}
}
