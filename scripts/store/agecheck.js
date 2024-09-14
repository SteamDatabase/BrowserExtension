/* global AddLinksInErrorBox */

'use strict';

if( GetCurrentAppID() > 0 )
{
	const elementIdsToTry =
	[
		'error_box',
		'app_agegate',
		'agegate_box',
	];

	for( const id of elementIdsToTry )
	{
		const container = document.getElementById( id );

		if( container )
		{
			AddLinksInErrorBox( container );
			break;
		}
	}
}

GetOption( { 'enhancement-skip-agecheck': false }, ( items ) =>
{
	if( items[ 'enhancement-skip-agecheck' ] )
	{
		let date = new Date();
		date.setFullYear( date.getFullYear() + 1 );
		date = date.toGMTString();

		document.cookie = 'wants_mature_content=1; expires=' + date + '; path=/; Secure; SameSite=Lax;';
		document.cookie = 'mature_content=1; expires=' + date + '; path=/; Secure; SameSite=Lax;';
		document.cookie = 'lastagecheckage=1-January-1900; expires=' + date + '; path=/; Secure; SameSite=Lax;';
		document.cookie = 'birthtime=-' + ( 30 ** 6 ) + '; expires=' + date + '; path=/; Secure; SameSite=Lax;';

		// Make sure we know how to bypass this agegate before redirecting
		// App 526520 causes inifite redirects due to an error message on agecheck url
		if( document.querySelector( '#agecheck_form, #app_agegate' ) )
		{
			document.location.href = document.location.href.replace( /\/agecheck/, '' );
		}
	}
	else
	{
		const container = document.getElementById( 'app_agegate' );

		if( !container )
		{
			return;
		}

		const optionsLink = document.createElement( 'a' );
		optionsLink.target = '_blank';
		optionsLink.textContent = _t( 'agecheck_option_hint' );
		optionsLink.href = GetLocalResource( 'options/options.html' ) + '#skip_agecheck';

		const linkContainer = document.createElement( 'div' );
		linkContainer.className = 'steamdb_error_link steamdb_agecheck_hint';
		linkContainer.append( optionsLink );

		container.append( linkContainer );
	}
} );
