'use strict';

if( document.querySelector( '.guideTopContent' ) )
{
	const guide = document.querySelector( '.guide' );
	const spoilers = guide.querySelectorAll( '.bb_spoiler' );

	if( spoilers.length > 0 )
	{
		const controls = document.querySelector( '#ItemControls' );

		const divider = document.createElement( 'div' );
		divider.className = 'vertical_divider';
		controls.append( divider );

		const checkboxWrapper = document.createElement( 'label' );
		checkboxWrapper.textContent = _t( 'spoilers_reveal' );
		checkboxWrapper.className = 'workshopItemControlCtn general_btn';

		const checkbox = document.createElement( 'input' );
		checkbox.type = 'checkbox';
		checkbox.style.display = 'none';
		checkboxWrapper.prepend( checkbox );
		controls.append( checkboxWrapper );

		checkbox.addEventListener( 'change', event =>
		{
			const reveal = event.target.checked;

			checkboxWrapper.style.backgroundColor = reveal ? '#2d6bcd' : '';
			checkboxWrapper.style.color = reveal ? '#fff' : '';

			for( const spoiler of spoilers )
			{
				spoiler.classList.toggle( 'steamdb_spoiler_revealed', reveal );
				spoiler.classList.toggle( 'bb_spoiler', !reveal );
			}
		} );
	}
}
