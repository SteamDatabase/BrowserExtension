'use strict';

const script = document.createElement( 'script' );
script.id = 'steamdb_disable_tooltips';
script.type = 'text/javascript';
script.src = GetLocalResource( 'scripts/store/account_licenses_injected.js' );
document.documentElement.append( script );

GetOption( { 'link-accountpage': true }, ( items ) =>
{
	const addLinks = items[ 'link-accountpage' ];

	if( document.readyState === 'loading' )
	{
		document.addEventListener( 'DOMContentLoaded', OnContentLoaded );
	}
	else
	{
		OnContentLoaded();
	}

	function OnContentLoaded()
	{
		const table = document.querySelector( '.account_table' );

		if( !addLinks || !table )
		{
			document.body.classList.add( 'steamdb_account_table_loaded' );
			return;
		}

		const licenses = table.querySelectorAll( 'tr' );

		if( licenses )
		{
			const params = new URLSearchParams();
			params.set( 'a', 'sub' );

			for( const tr of licenses )
			{
				const nameCell = tr.cells[ 1 ];

				if( nameCell.tagName === 'TH' )
				{
					const newTd = document.createElement( 'th' );
					newTd.className = 'steamdb_license_id_col';
					newTd.textContent = 'SteamDB';
					nameCell.after( newTd );

					continue;
				}

				const link = document.createElement( 'a' );
				const removeElement = nameCell.querySelector( '.free_license_remove_link a' );

				if( removeElement )
				{
					const subidMatch = removeElement.href.match( /RemoveFreeLicense\( ?(?<subid>[0-9]+)/ );

					if( !subidMatch )
					{
						continue;
					}

					const subid = subidMatch.groups.subid;

					link.href = `${GetHomepage()}sub/${subid}/`;
					link.textContent = subid;
				}
				else
				{
					params.set( 'q', nameCell.textContent.trim() );

					link.href = `${GetHomepage()}search/?${params.toString()}`;
					link.textContent = _t( 'Search' );
				}

				const newTd = document.createElement( 'td' );
				newTd.className = 'steamdb_license_id_col';
				newTd.append( link );
				nameCell.after( newTd );
			}
		}

		document.body.classList.add( 'steamdb_account_table_loaded' );
	}
} );
