/* global StartViewTransition */

'use strict';

const tierColors =
[
	'#b0c3d9',
	'#8cc6ff',
	'#6a7dff',
	'#c166ff',
	'#f03cff',
	'#eb4b4b',
	'#ffd700',
];

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLDivElement} tooltip
 */
const DrawChart = ( initialData, hoveredIndex = -1, canvas = null, tooltip = null, maxLength = 200 ) =>
{
	if( !canvas )
	{
		canvas = document.createElement( 'canvas' );
		canvas.className = 'steamdb_achievements_csrating_graph';
		document.querySelector( '#mainContents' ).append( canvas );

		tooltip = document.createElement( 'div' );
		tooltip.className = 'community_tooltip steamdb_achievements_csrating_graph_tooltip';
		document.body.append( tooltip );

		canvas.addEventListener( 'mousemove', ( event ) =>
		{
			const gap = canvas.offsetWidth / ( Math.min( initialData.length, maxLength ) );
			const x = event.offsetX - ( gap / 2 );
			const index = Math.ceil( x / gap );
			DrawChart( initialData, index, canvas, tooltip, maxLength );
			tooltip.style.display = 'block';

			const tooltipWidth = tooltip.clientWidth;
			const shiftTooltip = event.pageX + tooltipWidth - document.body.clientWidth;
			tooltip.style.left = shiftTooltip > 0
				? event.pageX - shiftTooltip + 'px'
				: event.pageX + 'px';
			tooltip.style.top = event.pageY + 30 + 'px';
		} );

		const resetCanvas = () =>
		{
			DrawChart( initialData, -1, canvas, tooltip, maxLength );
			tooltip.style.display = 'none';
		};
		canvas.addEventListener( 'mouseleave', resetCanvas );
		window.addEventListener( 'resize', resetCanvas );

		maxLength = Math.min( maxLength, initialData.length );
		const maxLengthInput = document.createElement( 'input' );
		maxLengthInput.className = 'steamdb_achievements_csrating_graph_slider';
		maxLengthInput.type = 'range';
		maxLengthInput.min = 10;
		maxLengthInput.max = initialData.length;
		maxLengthInput.value = maxLength;
		maxLengthInput.addEventListener( 'input', () =>
		{
			maxLength = maxLengthInput.value;
			DrawChart( initialData, -1, canvas, tooltip, maxLength );
		} );
		canvas.insertAdjacentElement( 'afterend', maxLengthInput );
	}

	const data = initialData.slice( 0, maxLength ).reverse();
	const points = data.map( d => d.csr );
	const maxCSR = Math.max( ...data.map( p => p.csr ) );

	const rect = canvas.getBoundingClientRect();
	const width = rect.width * devicePixelRatio;
	const height = rect.height * devicePixelRatio;

	const ctx = canvas.getContext( '2d' );

	if( !points || ctx === null )
	{
		return;
	}

	// Setting size clears the canvas
	canvas.width = width;
	canvas.height = height;

	// Draw gradient
	let i = 0;
	let lastTier = -1;
	const paddedHeight = height * 0.95;
	const halfHeight = height / 2;
	const gap = width / ( points.length - 1 );

	ctx.beginPath();
	ctx.moveTo( 0, height );

	for( const point of points )
	{
		const val = 2 * ( point / maxCSR - 0.5 );
		const x = i * gap;
		const y = ( -val * paddedHeight ) / 2 + halfHeight;

		const tier = Math.min( Math.floor( point / 5000 ), tierColors.length - 1 );

		if( lastTier !== tier )
		{
			if( i > 0 )
			{
				ctx.lineTo( x, y );
				ctx.lineTo( x, height );
				ctx.fill();
				ctx.beginPath();
				ctx.moveTo( x, height );
			}

			const grd = ctx.createLinearGradient( 0, 0, 0, height );
			grd.addColorStop( 0, tierColors[ tier ] + '22' );
			grd.addColorStop( 1, 'transparent' );
			ctx.fillStyle = grd;

			ctx.lineTo( x, y );

			lastTier = tier;
		}
		else
		{
			ctx.lineTo( x, y );
		}

		i += 1;
	}

	ctx.lineTo( width, height );
	ctx.fill();

	// Max tier dashed line
	const maxCSRTier = 2 * ( ( maxCSR - ( maxCSR % 5000 ) ) / maxCSR - 0.5 );
	const maxCSRTierY = ( -maxCSRTier * paddedHeight ) / 2 + halfHeight;
	ctx.strokeStyle = '#424857';
	ctx.lineWidth = 1 * devicePixelRatio;
	ctx.setLineDash( [ 7 * devicePixelRatio, 4 * devicePixelRatio ] );
	ctx.beginPath();
	ctx.moveTo( 0, maxCSRTierY );
	ctx.lineTo( width, maxCSRTierY );
	ctx.stroke();
	ctx.setLineDash( [] );

	// Draw line
	ctx.beginPath();
	ctx.lineWidth = 2 * devicePixelRatio;

	let circleX = null;
	let circleY = null;
	let highlightedCSR = '';
	let highlightedDate = '';
	i = 0;
	lastTier = -1;

	for( const point of points )
	{
		const val = 2 * ( point / maxCSR - 0.5 );
		const x = i * gap;
		const y = ( -val * paddedHeight ) / 2 + halfHeight;
		const tier = Math.min( Math.floor( point / 5000 ), tierColors.length - 1 );

		if( lastTier !== tier )
		{
			if( i > 0 )
			{
				ctx.lineTo( x, y );
				ctx.stroke();
				ctx.beginPath();
			}

			ctx.strokeStyle = tierColors[ tier ];
			ctx.moveTo( x, y );

			lastTier = tier;
		}
		else
		{
			ctx.lineTo( x, y );
		}

		if( hoveredIndex === i )
		{
			circleX = x;
			circleY = y;
			highlightedCSR = data[ i ].csr;
			highlightedDate = data[ i ].datetime;
		}

		i += 1;
	}

	ctx.stroke();

	if( circleX !== null && circleY !== null )
	{
		ctx.beginPath();
		ctx.fillStyle = '#fff';
		ctx.arc( circleX, circleY, 3 * devicePixelRatio, 0, Math.PI * 2 );
		ctx.fill();
		tooltip.textContent = `${highlightedCSR.toLocaleString( 'en-US' )}\n${highlightedDate}`;
	}
};

const CreateCSRatingTable = ( rows ) =>
{
	const table = document.createElement( 'table' );
	table.className = 'steamdb_achievements_csrating';
	document.querySelector( '#mainContents' ).append( table );

	const CreateHeader = () =>
	{
		const header = document.createElement( 'tr' );

		const headerTdDatetime = document.createElement( 'th' );
		headerTdDatetime.textContent = 'Date';
		const headerTdCSR = document.createElement( 'th' );
		headerTdCSR.textContent = 'CS Rating';
		const headerTdCSRdelta = document.createElement( 'th' );
		headerTdCSRdelta.textContent = 'Δ';
		header.append( headerTdDatetime, headerTdCSR, headerTdCSRdelta );

		return header;
	};

	let prevScore = 0;
	for( let i = rows.length - 1; i >= 0; i-- )
	{
		if( prevScore !== 0 )
		{
			rows[ i ].delta = rows[ i ].csr - prevScore;
		}
		prevScore = rows[ i ].csr;
	}

	const tbody = document.createElement( 'tbody' );
	table.append( tbody );

	let season;

	for( const row of rows )
	{
		if( season !== row.season )
		{
			season = row.season;
			const tr = document.createElement( 'tr' );
			tbody.append( tr );

			const th = document.createElement( 'th' );
			th.textContent = `Season ${season}`;
			th.colSpan = 3;
			th.className = 'steamdb_achievements_csrating_season';
			tr.append( th );

			tbody.append( CreateHeader() );
		}

		const tr = document.createElement( 'tr' );
		tbody.append( tr );

		const datetime = document.createElement( 'td' );
		datetime.textContent = row.datetime;
		tr.append( datetime );

		const csr = document.createElement( 'td' );
		csr.textContent = row.csr.toLocaleString( 'en-US' );
		const tier = Math.min( Math.floor( row.csr / 5000 ), tierColors.length - 1 );
		csr.className = 'steamdb_achievements_csrating-value';
		csr.style.color = tierColors[ tier ];
		tr.append( csr );

		const delta = document.createElement( 'td' );
		if( row.delta )
		{
			delta.textContent = ( row.delta > 0 ? '+' : '' ) + row.delta;
		}
		delta.className = row.delta > 0
			? 'steamdb_achievements_csrating_positive'
			: 'steamdb_achievements_csrating_negative';
		if( row.delta < -199 || row.delta > 199 )
		{
			delta.classList.add( 'steamdb_achievements_csrating_significant' );
		}
		tr.append( delta );
	}
};

const FetchCSRating = async( profileUrl ) =>
{
	const res = await fetch( `https://steamcommunity.com${profileUrl}/gcpd/730?tab=majors` );
	const html = await res.text();

	const parser = new DOMParser();
	const dom = parser.parseFromString( html, 'text/html' );

	const rows = [ ...dom.querySelectorAll( 'tr' ) ]
		.filter( tr => tr.querySelector( 'td' )?.textContent.startsWith( 'premier' ) );

	const dateFormatter = new Intl.DateTimeFormat( GetLanguage(), {
		dateStyle: 'medium',
		timeStyle: 'short',
	} );

	const premierRows = [];
	for( const row of rows )
	{
		premierRows.push( {
			season: row.querySelector( 'td' ).textContent.replace( 'premier_season', '' ),
			datetime: dateFormatter.format(
				new Date( row.querySelector( 'td:nth-child(2)' ).textContent ).getTime(),
			),
			csr: Number( row.querySelector( 'td:nth-child(3)' ).textContent ) >> 15,
		} );
	}

	if( premierRows.length )
	{
		StartViewTransition( () =>
		{
			DrawChart( premierRows );
			CreateCSRatingTable( premierRows );
		} );
	}
};

const removeTrailingSlash = ( str ) => str.endsWith( '/' ) ? str.slice( 0, -1 ) : str;

const viewingProfile = removeTrailingSlash( document.querySelector( '.pagecontent .persona_name_text_content' )?.pathname ?? '' );
const myProfile = removeTrailingSlash( document.querySelector( '#global_actions .user_avatar' )?.pathname ?? '' );

if( viewingProfile === myProfile )
{
	FetchCSRating( myProfile );
}
