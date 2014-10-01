var CurrentAppID,
	GetCurrentAppID = function()
	{
		if( !CurrentAppID )
		{
			CurrentAppID = location.pathname.match( /\/([0-9]{1,6})(?:\/|$)/ );
			
			if( CurrentAppID )
			{
				CurrentAppID = parseInt( CurrentAppID[ 1 ], 10 );
			}
			else
			{
				CurrentAppID = -1;
			}
		}
		
		return CurrentAppID;
	},
	
	GetHomepage = function()
	{
		return 'https://steamdb.info/';
	},
	
	GetOption = function( items, callback )
	{
		if( typeof chrome !== 'undefined' )
		{
			chrome.storage.local.get( items, callback );
		} 
		else if( typeof self.options.firefox !== 'undefined' )
		{
			for( var item in items )
			{
				items[ item ] = self.options.preferences[ item ];
			}
			
			callback( items );
		}
	},
	
	GetLocalResource = function( res )
	{
		if( typeof chrome !== 'undefined' )
		{
			return chrome.extension.getURL( res );
		} 
		else if( typeof self.options.firefox !== 'undefined' )
		{
			return self.options[ res ];
		}
		
		return res;
	};
