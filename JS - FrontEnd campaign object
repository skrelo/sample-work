// Campaign driver
// uses NodeJS socket.io
// depends on jQuery

var Campaign = {

	campaigns       : {},
	campaign_id : null,
	campaignData : {},
	loadCampaignStep: function ( campaign, step ) {
		var self = this;
		this.campaignData.campaign = campaign;
		this.campaignData.step = step;
		this.campaigns[ campaign ].setup_steps.forEach( function( key ) {
			var setup = Object.keys(key );
			setup = setup[0];
			if ( setup == step ) {
				if ( key[ setup ].hasOwnProperty( 'class' ) ) {
					var cl = key[ setup ].class;
					
					// Load sub class initializer
					var method = key[ setup ].method;
					var full = key[setup].full;
					eval( full + "('" + campaign + "')" );
				}
				return;
			}

		});
	},
	stepBack : function() {
		if ( Campaign.campaignData.step == 1 ) return;
		var step = parseInt( Campaign.campaignData.step );
		$( '.campaign-step' + step ).hide();
		$( '.campaign-step' + ( step - 1 ) ).show();
		Campaign.campaignData.step = step--;
	},

	returnNewCampaignModal: function ( content ) {
		if ( $( '#campaign-editor' ).size() > 0 ) $( '#campaign-editor' ).remove();
		$( 'body' ).append( content );
		$( '#campaign-editor' ).modal( 'show' );
	},
	loadNewCampaign       : function ( e ) {
		e.preventDefault();
		socket.emit( 'loadNewCampaign', {} );
	},
	loadCampaignServices  : function ( e ) {
		e.preventDefault();
		var campaign = $( this ).data( 'campaign' );
		console.log( campaign );
		socket.emit( 'loadCampaignServices', { campaign_id: campaign } );
	},
	returnCampaignServices: function ( services ) {
		console.log ( services );
		var campaign = Campaign.campaignData.campaign;
		var step = Campaign.campaignData.step;
		Campaign.campaignData.services = services;
		Campaign.loadCampaignStep(campaign, step);
		//console.log( services );
	},
	getCampaigns          : function () {
		socket.emit( 'getCampaigns', {} );
	},
	setCampaigns          : function ( campaigns ) {
		console.log( campaigns );
		for( var i in campaigns ) {
			Campaign.campaigns[ campaigns[ i ].campaign_id ] = {};
			Campaign.campaigns[ campaigns[ i ].campaign_id ] = campaigns[ i ];
		}
	}


};

( function ( $ ) {


	// Request new campaign modal from socket
	$( document ).on( 'click', '#load-new-campaign', Campaign.loadNewCampaign );
	$( document ).on( 'click', '.campaign-stepback', Campaign.stepBack );

	// Load Campaign Services
	$( document ).on( 'click', '[data-campaign]', function( e ) {
		e.preventDefault();
		var campaign = $( this ).data( 'campaign' );
		var step = $( this ).data( 'campaign-step' );
		Campaign.loadCampaignStep( campaign, step );
	});

	// Return from socket new campaign modal
	socket.on( 'returnNewCampaign', Campaign.returnNewCampaignModal );
	
	// Return from socket campaign services
	socket.on( 'returnCampaignServices', Campaign.returnCampaignServices );
	socket.on( 'returnGetCampaigns', Campaign.setCampaigns );


}( jQuery ) );
