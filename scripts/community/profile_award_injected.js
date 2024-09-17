'use strict';

( ( () =>
{
	if( !( 'g_rgProfileData' in window ) || !( 'fnLoyalty_ShowAwardModal' in window ) )
	{
		return;
	}

	const params = new URLSearchParams( window.location.search );
	const awardId = params.get( 'award' );

	if( awardId === null )
	{
		return;
	}

	window.fnLoyalty_ShowAwardModal(
		window.g_rgProfileData.steamid,
		3, // profile
		() =>
		{
			// do nothing
		},
		undefined, // ugcType
		Number.parseInt( awardId, 10 ),
	);
} )() );
