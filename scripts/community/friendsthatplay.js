'use strict';

GetOption( { 'enhancement-friendsthatown': true }, function( items )
{
	if( !items[ 'enhancement-friendsthatown' ] )
	{
		return;
	}
	
	var xhrfriends = new XMLHttpRequest();
	var xhr = new XMLHttpRequest();
	var appid = GetCurrentAppID();
	var bDoneAsync = false;
	
	var HTTPCallback = function()
	{
		if( this.readyState !== XMLHttpRequest.DONE || this.status !== 200 )
		{
			return;
		}
		
		if( !bDoneAsync )
		{
			bDoneAsync = true;
			
			return;
		}
		
		if( !xhr.response[ appid ].success )
		{
			return;
		}
		
		var friendsown = xhr.response[ appid ].data.friendsown;
		if( !friendsown.length )
		{
			return;
		}
		
		var friends = xhrfriends.response.querySelector( '.profile_friends' ).children;
		var i, steamID, miniprofiles = {};
		
		for( i = 0; i < friends.length; ++i )
		{
			steamID = friends[ i ].getAttribute( 'data-miniprofile' );
			
			miniprofiles[ steamID ] = friends[ i ];
		}
		
		var fragment = document.createDocumentFragment();
		
		var div = document.createElement( 'div' );
		div.className = 'mainSectionHeader friendListSectionHeader';
		div.appendChild( document.createTextNode( friendsown.length + ' friends who own this game ' ) );
		
		var span = document.createElement( 'span' );
		span.className = 'underScoreColor';
		span.appendChild( document.createTextNode( '_' ) );
		div.appendChild( span );
		
		fragment.appendChild( div );
		
		div = document.createElement( 'div' );
		div.className = 'profile_friends';
		
		for( i = 0; i < friendsown.length; ++i )
		{
			steamID = friendsown[ i ].steamid.slice( 4 ) - 1197960265728;
			
			var newText = document.createElement( 'div' );
			newText.className = 'friendSmallText';
			
			var hours = Math.round( friendsown[ i ].playtime_twoweeks / 60 * 10 ) / 10 + ' hrs';
			hours += ' / ' + Math.round( friendsown[ i ].playtime_total / 60 * 10 ) / 10 + ' hrs';
			newText.appendChild( document.createTextNode( hours ) );
			
			newText.appendChild( document.createElement( 'br' ) );
			
			var compareLink = document.createElement( 'a' );
			compareLink.className = 'whiteLink friendBlockInnerLink';
			compareLink.href = miniprofiles[ steamID ].querySelector( '.friendBlockLinkOverlay' ).href + '/stats/' + appid + '/compare';
			compareLink.appendChild( document.createTextNode( 'View stats' ) );
			
			newText.appendChild( compareLink );
			
			var originalText = miniprofiles[ steamID ].querySelector( '.friendSmallText' );
			originalText.parentNode.replaceChild( newText, originalText );
			
			div.appendChild( miniprofiles[ steamID ] );
		}
		
		var clearleftdiv = document.createElement( 'div' );
		clearleftdiv.style.clear = 'left';
		div.appendChild( clearleftdiv );
		
		fragment.appendChild( div );
		
		document.getElementById( 'memberList' ).appendChild( fragment );
		
		// We need to reinitialize miniprofile hovers
		var script = document.createElement( 'script' );
		script.id = 'steamdb_init_miniprofiles';
		script.type = 'text/javascript';
		script.appendChild( document.createTextNode( 'InitMiniprofileHovers();' ) );
		
		document.head.appendChild( script );
	};
	
	xhrfriends.onreadystatechange = HTTPCallback;
	xhrfriends.open( 'GET', '//steamcommunity.com/my/friends/', true );
	xhrfriends.responseType = 'document';
	xhrfriends.send();
	
	xhr.onreadystatechange = HTTPCallback;
	xhr.open( 'GET', '//store.steampowered.com/api/appuserdetails/?appids=' + appid, true );
	xhr.responseType = 'json';
	xhr.send();
} );
