'use strict';

const progressInfo = document.querySelectorAll( '.progress_info_bold' );

if( progressInfo.length > 0 )
{
	let apps = 0;
	let drops = 0;
	let match;
	
	for( let i = 0; i < progressInfo.length; i++ )
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
		const text = document.createElement( 'span' );
		text.className = 'steamdb_drops_remaining';
		text.appendChild( document.createTextNode( drops + ' drops remaining across ' + apps + ' apps' + ( document.querySelector( '.pageLinks' ) ? ' on this page' : '' ) ) );
		
		const container = document.querySelector( '.badge_details_set_favorite' );
		
		if( container )
		{
			container.insertBefore( text, container.firstChild );
		}
	}
}
