( function()
{
	'use strict';

	if( window.g_CommunityPreferences )
	{
		window.g_CommunityPreferences.hide_adult_content_sex = 0;
		window.g_CommunityPreferences.hide_adult_content_violence = 0;

		// The data may already exist, but before this function is called
		window.CheckAppAgeGateBypass = function SteamDB_CheckAppAgeGateBypass( appid, bCheckAppAgeGateBypass, callbackFunc )
		{
			callbackFunc( false );
		};
	}
	else
	{
		let communityPreferences =
		{
			hide_adult_content_sex: 0,
			hide_adult_content_violence: 0,
		};

		Object.defineProperty( window, 'g_CommunityPreferences', {
			get()
			{
				return communityPreferences;
			},
			set( newVal )
			{
				newVal.hide_adult_content_sex = 0;
				newVal.hide_adult_content_violence = 0;
				communityPreferences = newVal;

				window.CheckAppAgeGateBypass = function SteamDB_CheckAppAgeGateBypass( appid, bCheckAppAgeGateBypass, callbackFunc )
				{
					callbackFunc( false );
				};
			},
		} );
	}

	const observer = new MutationObserver( function( mutations )
	{
		mutations.forEach( function( mutation )
		{
			if( !mutation.addedNodes )
			{
				return;
			}

			for( const node of mutation.addedNodes )
			{
				if( node.id === 'footer' )
				{
					observer.disconnect();
				}
				else if( node.id === 'application_config' )
				{
					observer.disconnect();

					const community = JSON.parse( node.dataset.community );

					if( community.HAS_ADULT_CONTENT || community.HAS_ADULT_CONTENT_SEX || community.HAS_ADULT_CONTENT_VIOLENCE )
					{
						community.HAS_ADULT_CONTENT = false;
						community.HAS_ADULT_CONTENT_SEX = false;
						community.HAS_ADULT_CONTENT_VIOLENCE = false;
						node.dataset.community = JSON.stringify( community );
					}
				}
			}
		} );
	} );

	observer.observe( document, {
		childList: true,
		subtree: true,
	} );
}() );
