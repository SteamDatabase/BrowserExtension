'use strict';

( ( () =>
{
	document.querySelectorAll( '.steamdb_dev_pub_link_container .more_btn' ).forEach( ( button ) =>
	{
		button.remove();
	} );

	window.CollapseLongStrings( '.steamdb_dev_pub_link_container .summary.column' );
} )() );
