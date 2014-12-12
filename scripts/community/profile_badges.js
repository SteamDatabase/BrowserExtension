'use strict';

var progressInfo = document.querySelectorAll( '.progress_info_bold' ),
    length = progressInfo.length;

if( length > 0 )
{
	var apps = 0, drops = 0, match;
	
	for( var i = 0; i < length; i++ )
	{
		match = progressInfo[ i ].textContent.match( /([0-9]+) card drops? remaining/ );
		
		if( match )
		{
			match = parseInt( match[ 1 ], 10 ) || 0;
			
			if( match > 0 )
			{
				apps++;
				drops += match;
			}
		}
	}
	
	if( apps > 0 )
	{
		var text = document.createElement( 'span' );
		text.className = 'steamdb_drops_remaining';
		text.appendChild( document.createTextNode( drops + ' drops remaining across ' + apps + ' apps' ) );
		
		var parent = document.querySelector( '.badge_details_set_favorite' );
		
		if( parent )
		{
			parent.insertBefore( text, parent.firstChild );
		}
	}
}
