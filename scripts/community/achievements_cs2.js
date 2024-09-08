/* global StartViewTransition */

'use strict';

const CreateCSRatingTable = ( rows ) =>
{
	const table = document.createElement( 'table' );
	table.className = 'steamdb_achievements_csrating';

	const thead = document.createElement( 'thead' );
	table.append( thead );

	const header = document.createElement( 'tr' );
	thead.append( header );

	const headerTdSeason = document.createElement( 'th' );
	headerTdSeason.textContent = 'Season';
	const headerTdDatetime = document.createElement( 'th' );
	headerTdDatetime.textContent = 'Updated';
	const headerTdCSR = document.createElement( 'th' );
	headerTdCSR.textContent = 'CS Rating';
	const headerTdCSRdelta = document.createElement( 'th' );
	headerTdCSRdelta.textContent = 'Δ';
	header.append( headerTdSeason, headerTdDatetime, headerTdCSR, headerTdCSRdelta );

	let prevScore = 0;
	for( let i = rows.length - 1; i >= 0; i-- )
	{
		if( prevScore !== 0 )
		{
			rows[ i ].delta = rows[ i ].csr - prevScore;
		}
		prevScore = rows[ i ].csr;
	}

	const dateFormatter = new Intl.DateTimeFormat( GetLanguage(), {
		dateStyle: 'medium',
		timeStyle: 'short',
	} );

	const tbody = document.createElement( 'tbody' );
	table.append( tbody );

	for( const row of rows )
	{
		const tr = document.createElement( 'tr' );
		tbody.append( tr );

		const season = document.createElement( 'td' );
		season.textContent = `Season ${row.season}`;
		tr.append( season );

		const datetime = document.createElement( 'td' );
		datetime.textContent = dateFormatter.format( new Date( row.datetime ).getTime() );
		tr.append( datetime );

		const csr = document.createElement( 'td' );
		csr.textContent = row.csr;
		const tier = Math.floor( row.csr / 5000 );
		csr.className = `steamdb_achievements_csrating-value steamdb_achievements_csrating-tier${tier}`;
		tr.append( csr );

		const delta = document.createElement( 'td' );
		delta.textContent = row.delta;
		delta.className = row.delta > 0
			? 'steamdb_achievements_csrating_positive'
			: 'steamdb_achievements_csrating_negative';
		tr.append( delta );
	}

	StartViewTransition( () =>
	{
		document.querySelector( '#mainContents' ).append( table );
	} );
};

const FetchCSRating = async() =>
{
	const res = await fetch( 'https://steamcommunity.com/my/gcpd/730?tab=majors' );
	const html = await res.text();

	const parser = new DOMParser();
	const dom = parser.parseFromString( html, 'text/html' );

	const rows = [ ...dom.querySelectorAll( 'tr' ) ]
		.filter( tr => tr.querySelector( 'td' )?.textContent.startsWith( 'premier' ) );

	const premierRows = [];
	for( const row of rows )
	{
		premierRows.push( {
			season: row.querySelector( 'td' ).textContent.replace( 'premier_season', '' ),
			datetime: row.querySelector( 'td:nth-child(2)' ).textContent,
			csr: Number( row.querySelector( 'td:nth-child(3)' ).textContent ) >> 15,
		} );
	}

	if( premierRows.length )
	{
		CreateCSRatingTable( premierRows );
	}
};

const removeTrailingSlash = ( str ) => str.endsWith( '/' ) ? str.slice( 0, -1 ) : str;

const viewingProfile = removeTrailingSlash( document.querySelector( '.pagecontent .persona_name_text_content' ).pathname );
const myProfile = removeTrailingSlash( document.querySelector( '.user_avatar' ).pathname );

if( viewingProfile === myProfile )
{
	FetchCSRating();
}
