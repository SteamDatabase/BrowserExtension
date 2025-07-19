'use strict';

/** @type {HTMLSelectElement} */
const gameSelector = document.querySelector( '#booster_game_selector' );

if( gameSelector )
{
	// Add a `div` container to display the booster pack available date
	const availableDateContainer = document.createElement( 'div' );
	availableDateContainer.id = 'booster_available_date';
	gameSelector.after( availableDateContainer );

	// Add an event listener to catch the details about the choosen booster pack
	// This data is sent by `boostercreator_injected.js` when the game selector changes
	gameSelector.addEventListener( 'boosterPackChange', function( event )
	{
		/** @type {CustomEvent<{ available_at_time?: string }>} */
		const customEvent = /** @type {CustomEvent} */ ( event );
		displayBoosterAvailableDate( customEvent.detail?.available_at_time );
	} );
}

/**
 * @param {string | undefined} availableDate
 */
function displayBoosterAvailableDate( availableDate )
{
	const availableDateContainer = document.getElementById( 'booster_available_date' );

	if( availableDate )
	{
		availableDateContainer.textContent = _t( 'boostercreator_available_at_date', [ availableDate ] );
	}
	else
	{
 		availableDateContainer.textContent = '';
	}
}

// Inject a script into the page, so we can access page Steam variables
const script = document.createElement( 'script' );
script.id = 'steamdb_boostercreator';
script.type = 'text/javascript';
script.src = GetLocalResource( 'scripts/community/boostercreator_injected.js' );
document.head.appendChild( script );
