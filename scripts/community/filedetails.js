'use strict';

// Awards
if( window.location.search.includes( 'award' ) )
{
	const script = document.createElement( 'script' );
	script.id = 'steamdb_filedetails_award';
	script.type = 'text/javascript';
	script.src = GetLocalResource( 'scripts/community/filedetails_award_injected.js' );
	document.head.appendChild( script );
}
