"use strict";

GetOption( { 'enhancement-friendsthatown': false }, function( items ) {
	if( items['enhancement-friendsthatown'] ) {
		var xhrfriends = new XMLHttpRequest();
		var xhr = new XMLHttpRequest();
		var bDoneAsync = false;

		var HTTPCallback = function () {
			if( this.readyState != XMLHttpRequest.DONE || this.status != 200 ) {
				return;
			}

			if( !bDoneAsync ) {
				bDoneAsync = true;
				return;
			}

			if( !xhr.response[GetCurrentAppID()].success ) {
				return;
			}

			var friendsown = xhr.response[GetCurrentAppID()].data.friendsown;
			if( !friendsown || friendsown.length <= 0 ) {
				return;
			}

			var friends = xhrfriends.response.querySelector( '.profile_friends' ).children;
			var miniprofiles = {};
			for( var i = 0; i < friends.length; ++i ) {
				var steamID = friends[i].getAttribute( 'data-miniprofile' );

				miniprofiles[steamID] = friends[i];
			}

			var container = document.getElementById( 'memberList' );

			var div = document.createElement( 'div' );
			div.className = 'mainSectionHeader friendListSectionHeader';
			div.appendChild(document.createTextNode(friendsown.length + ' Friends who own this game '));

			var span = document.createElement( 'span' );
			span.className = 'underScoreColor';
			span.appendChild(document.createTextNode( "_" ));
			div.appendChild(span);

			container.appendChild(div);

			div = document.createElement( 'div' );
			div.className = 'profile_friends';
			div.style.height = (52 * friendsown.length / 3).toString() + 'px';

			for(var i = 0; i < friendsown.length; ++i) {
				var steamID = friendsown[i].steamid.slice(4) - 1197960265728;

				div.appendChild(miniprofiles[steamID]);
			}

			var clearleftdiv = document.createElement( 'div' );
			clearleftdiv.style.clear = 'left';
			div.appendChild(clearleftdiv);

			container.appendChild(div);

			var script = document.createElement( 'script' );
			script.appendChild(document.createTextNode( '(function() { InitMiniprofileHovers(); })();' ));
			document.head.appendChild(script);
		}

		xhrfriends.onreadystatechange = HTTPCallback;
		xhrfriends.open( "GET", '//steamcommunity.com/my/friends/', true );
		xhrfriends.responseType = "document";
		xhrfriends.send();

		xhr.onreadystatechange = HTTPCallback;
		xhr.open( "GET", '//store.steampowered.com/api/appuserdetails/?appids=' + GetCurrentAppID(), true );
		xhr.responseType = "json";
		xhr.send();
	}
} );