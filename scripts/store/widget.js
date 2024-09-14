'use strict';

GetOption( { 'link-subid-widget': true }, ( items ) =>
{
	if( !items[ 'link-subid-widget' ] )
	{
		return;
	}

	const link = document.createElement( 'a' );
	link.className = 'btn_black btn_tiny steamdb_link';
	link.target = '_blank';

	const text = document.createElement( 'span' );
	text.className = 'steamdb_link_id';

	const subid = document.querySelector( 'input[name="subid"]' );

	if( subid )
	{
		link.href = GetHomepage() + 'sub/' + subid.value + '/';
		text.textContent = subid.value.toString();
	}
	else
	{
		const appid = GetCurrentAppID();

		link.href = GetHomepage() + 'app/' + appid + '/';
		text.textContent = appid.toString();
	}

	const span = document.createElement( 'span' );
	span.dataset.tooltipText = _t( 'view_on_steamdb' );

	const hash = document.createElement( 'span' );
	hash.style.fontWeight = 'bold';
	hash.textContent = '# ';
	span.append( hash );

	span.append( text );
	link.append( span );

	let platforms = document.querySelector( '.game_area_purchase_platform' );

	if( !platforms )
	{
		platforms = document.createElement( 'div' );
		platforms.className = 'game_area_purchase_platform';

		const widget = document.getElementById( 'widget' );

		if( !widget )
		{
			return;
		}

		widget.append( platforms );
	}

	platforms.append( link );
} );
