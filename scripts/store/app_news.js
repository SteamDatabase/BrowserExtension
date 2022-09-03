/* global AddLinksInErrorBox */

'use strict';

const container = document.getElementById( 'error_box' );

if( container && GetCurrentAppID() > 0 )
{
	AddLinksInErrorBox( container );
}
