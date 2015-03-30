'use strict';

GetOption( { 'link-accountpage': true }, function( items )
{
	if( !items[ 'link-accountpage' ] )
	{
		return;
	}
	
	// TODO: Look for RemoveFreePackage subids
	
	var licenses = document.querySelectorAll( '.account_table tr > td:first-child' ),
	    link,
	    title,
	    element,
	    removeElement;
	
	if( licenses )
	{
		for( var i = 0, length = licenses.length; i < length; i++ )
		{
			element = licenses[ i ];
			title = element.textContent;
			
			link = document.createElement( 'a' );
			
			// nextSibling won't work due to whitespace
			removeElement = element.parentNode.querySelector( 'td:nth-child(2) > a' );
			
			if( removeElement )
			{
				if( !title.length )
				{
					title = '?? no package name ??';
					
					element.appendChild( document.createTextNode( title ) );
				}
				
				removeElement = removeElement.href.match( /RemoveFreeLicense\( ?([0-9]+)/ );
				
				link.href = GetHomepage() + 'sub/' + ( removeElement ? removeElement[ 1 ] : removeElement ) + '/';
			}
			// Valve somehow managed not to put package name on the page
			else if( !title.length )
			{
				continue;
			}
			else
			{
				link.href = GetHomepage() + 'search/?a=sub&q=' + encodeURIComponent( title );
			}
			
			link.target = '_blank';
			link.appendChild( document.createTextNode( title ) );
			
			element.replaceChild( link, element.firstChild );
		}
	}
} );
