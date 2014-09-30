GetOption( [ 'enhancement-skip-agecheck' ], function( items )
{
	if( items[ 'enhancement-skip-agecheck' ] === false )
	{
		var date = new Date();
		date.setFullYear( date.getFullYear() + 1 );
		date = date.toGMTString();
		
		document.cookie = 'lastagecheckage=1-January-1900; expires=' + date + '; path=/;';
		document.cookie = 'birthtime=-' + Math.pow( 30, 6 ) + '; expires=' + date + '; path=/;';
		
		document.location.href = document.location.href.replace( /\.com\/agecheck/, '.com' )
	}
} );
