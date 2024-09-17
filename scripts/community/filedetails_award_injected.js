'use strict';

( ( () =>
{
	if( !( 'PublishedFileAward' in window ) )
	{
		return;
	}

	const params = new URLSearchParams( window.location.search );
	const awardId = params.get( 'award' );

	if( awardId === null )
	{
		return;
	}

	const button = document.querySelector( '.general_btn[onClick^="PublishedFileAward"]' );

	if( !button )
	{
		console.log( '[SteamDB] Failed to find PublishedFileAward button' );
		return;
	}

	const data = button.getAttribute( 'onClick' ).match( /PublishedFileAward\(\s*'(?<id>[0-9]+)',\s*(?<fileType>[0-9]+)\s*\)/ );

	if( !data )
	{
		console.log( '[SteamDB] Failed to extract data from PublishedFileAward button' );
		return;
	}

	window.PublishedFileAward(
		data.groups.id,
		Number.parseInt( data.groups.fileType, 10 ),
		Number.parseInt( awardId, 10 ),
	);
} )() );
