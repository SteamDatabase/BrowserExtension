'use strict';

GetOption( { 'enhancement-fakecc-warning': true }, function( items )
{
	if( !items[ 'enhancement-fakecc-warning' ] )
	{
		return;
	}
	
	// Why can't we have nice things?!
	function GetCookie( sKey )
	{
		return decodeURIComponent( document.cookie.replace( new RegExp("(?:(?:^|.*;)\\s*" + sKey + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1" ) ) || null;
	}

	function GetCountryFlagURL( cc )
	{
		return 'https://steamcommunity-a.akamaihd.net/public/images/countryflags/' + cc.toLowerCase() + '.gif';
	}

	var fakeCC = GetCookie( 'fakeCC' );

	if( fakeCC !== null )
	{
		var steamCC = GetCookie( 'steamCC_\\d+_\\d+_\\d+_\\d+' );
		
		if( steamCC !== null && fakeCC !== steamCC )
		{
			var onClickEvent = function( )
			{
				this.className = '';
				this.removeEventListener( 'click', onClickEvent, false );
			};
			
			var container = document.createElement( 'div' );
			container.id = 'steamdb_fakecc';
			container.className = 'collapsed';
			container.addEventListener( 'click', onClickEvent, false );
			
			// Flag
			var image = document.createElement( 'img' );
			image.id = 'steamdb_fakecc_flag';
			image.src = GetCountryFlagURL( fakeCC );
			image.addEventListener( 'error', function( )
			{
				this.src = GetCountryFlagURL( 'fam' ); // Just display some flag on error
			} );
			
			container.appendChild( image );
			
			// Text
			var text = document.createElement( 'p' );
			text.appendChild( document.createTextNode( 'Your currency is currently set to ' + fakeCC ) );
			
			container.appendChild( text );
			
			// Link
			var link = document.createElement( 'a' );
			link.href = '#';
			link.appendChild( document.createTextNode( 'Would you like to reset it?' ) );
			
			text = document.createElement( 'p' );
			
			text.appendChild( link );
			container.appendChild( text );
			
			document.body.appendChild( container );
			
			// Link listener
			link.addEventListener( 'click', function( ev )
			{
				ev.preventDefault();
				
				document.body.removeChild( container );
				
				var date = new Date();
				date.setFullYear( date.getFullYear() - 30 );
				date = date.toGMTString();
				
				document.cookie = 'fakeCC' + '=none; expires=' + date + '; path=/';
				
				window.location.href =
					window.location.pathname +
					window.location.search.replace( /([?&])cc=[a-zA-Z]+&?/, '$1' ).replace( /[?&]$/, '' ) +
					window.location.hash;
			}, false );
		}
	}
} );
