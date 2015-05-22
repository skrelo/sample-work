// Template Item Loader - Custom jQuery widget
// @author skrelo@gmail.com
//----------------------------

var a2a_config = a2a_config || {};
var frontAjax = "/admin/front";
var addr = addr || null;

// Listing objects
//-----------------------------------------
var _RawListingData = {};
var g_user_data = g_user_data || {};

// Stores objects of the listings currently viewed
// set the object keys as the MLS id's
// @todo - Add new listing objects as user loads more listings
//---------------------------------------------------------------
var ListingData = {};
var ListingOrder = [];
var SimilarListings = {};
var ActiveListing = {};
var Favorites = [];
var SingleListings = window.hasOwnProperty( 'SingleListings' ) ? SingleListings : {};

var SimilarListingsSettings = {};
var MortgageCalculatorSettings = {};
var ModalEnabled = false;
var ActiveDOM = null;
var WebsitePrimaryColor = null;
var FeaturedAgent = {};

// Stores the previous, current, and next MLS id's
// Stores an object of the current listing
//---------------------------------------------------
var Listings = function () {
	this._current = null;
	this._previous = null
	this._next = null;
	this.isSimilar = null;
	this.isSingle = null;
	this._data = {};
};

// Set to 'true' if property detail modal vs/ static property detail is activated
var PDM = true;

// Return data from current listing
//-----------------------------------
Listings.prototype.getData = function () {
	if ( this.isSimilar ) {
		var active = SimilarListings[ this._current ];
	}else if ( this.isSingle ) {
		var active = SingleListings[ this._current ];
	} else {
		var active = ListingData[ this._current ];
	}
	ActiveListing = active;
	return active;
};

// Get 'Next' Listing
//------------------------------
Listings.prototype.getNext = function () {
	if ( this._next != null ) {
		this.setProperty( this._next );
		return this._current;
	}
};
// Get 'Previous' Listing
//------------------------------
Listings.prototype.getPrevious = function () {
	if ( this._previous != null ) {
		this.setProperty( this._previous );
		return this._current;
	}
};

// Sets up object of current, previous and next from passed in MLS id
//--------------------------------------------------------------------------
Listings.prototype.setProperty = function ( mls, isSimilar, isSingle ) {

	this.isSimilar = isSimilar;
	this.isSingle = isSingle;
	if ( isSimilar ) {
		this._previous = isSimilar;
		this._current = mls;
		this._next = null;
	} else if ( isSingle ) {
		this._current = mls;
		this._next = null;
		this._previous = null;
	}else {
		this._previous = null;
		this._current = null;
		this._next = null;

		var index = parseInt( jQuery.inArray( mls, ListingOrder ) );
		this._current = mls;
		if ( index > 0 ) {
			this._previous = ListingOrder[ index - 1 ];
		}
		if ( index < ListingOrder.length - 1 ) {
			this._next = ListingOrder[ index + 1 ];
		}
	}
	jQuery( '#listing-next' ).css( 'opacity', ( null == this._next ) ? .4 : 1 );
	jQuery( '#listing-prev' ).css( 'opacity', ( null == this._previous ) ? .4 : 1 );

};

// Loads and populates the property details modal from given MLS id
//--------------------------------------------------------------------
var PropertyDetails = function ( mls, isSimilar ) {
	this._listing = new Listings();
	this._listing.setProperty( mls );
	this._data = this._listing.getData();
	//this._property = new Property( this._listing.getCurrent() );
};

var OptionsSet = false;
var SetOptions = function( overrideOptions ) {
	if ( true == OptionsSet ) return;
	var $ = jQuery;
	if ( overrideOptions ) g_user_data = overrideOptions;

	ModalEnabled = g_user_data.hasOwnProperty( 'details_modal_disabled' ) && 1 == g_user_data.details_modal_disabled ? false : true;
	SimilarListingsSettings = g_user_data.hasOwnProperty( 'similar_listings_settings' ) ? g_user_data.similar_listings_settings : {};
	MortgageCalculatorSettings = g_user_data.hasOwnProperty( 'mortgage_calculator_settings' ) ? g_user_data.mortgage_calculator_settings : {};
	Favorites = g_user_data.hasOwnProperty( 'favorites' ) ? g_user_data.favorites : [];
	OptionsSet = true;


	if ( ModalEnabled && ! $( '#property-detail-modal' ).size() ) {
		var params = { action : "get_property_modal" };
		$.post( frontAjax, params, function ( data ) {
			$( data.html ).appendTo( 'body' );

		}, 'json' );

	}


	// Add Gradient Button based on website settings, or use blue for default
	var website_colors = {
		primary_color: null,
		btn_color_1  : '#529ce3',
		btn_color_2  : '#3b70b2',
		btn_text : '#ffffff'
	};

	if ( g_user_data.hasOwnProperty( 'website_colors' ) ) {
		website_colors = g_user_data.website_colors;
	}
	website_colors.btn_color_1 = website_colors.btn_color_1 ? website_colors.btn_color_1 : '#529ce3';
	website_colors.btn_color_2 = website_colors.btn_color_2 ? website_colors.btn_color_2 : '#3b70b2';
	website_colors.btn_text = website_colors.btn_text ? website_colors.btn_text : '#ffffff';
	var blubtn = '<style type="text/css">	.blue-gradient-btn, input[type="submit"].blue-gradient-btn { \
		background: ' + website_colors.btn_color_1 + '; \
		background: -moz-linear-gradient(top, ' + website_colors.btn_color_1 + ' 0%, ' + website_colors.btn_color_2 + ' 100%); \
		background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, ' + website_colors.btn_color_1 + '), color-stop(100%, ' + website_colors.btn_color_2 + ')); \
		background: -webkit-linear-gradient(top, ' + website_colors.btn_color_1 + ' 0%, ' + website_colors.btn_color_2 + ' 100%); \
		background: -o-linear-gradient(top, ' + website_colors.btn_color_1 + ' 0%, ' + website_colors.btn_color_2 + ' 100%); \
		background: -ms-linear-gradient(top, ' + website_colors.btn_color_1 + ' 0%, ' + website_colors.btn_color_2 + ' 100%); \
		background: linear-gradient(to bottom, ' + website_colors.btn_color_1 + ' 0%, ' + website_colors.btn_color_2 + ' 100%); \
		filter:     progid:DXImageTransform.Microsoft.gradient(startColorstr="' + website_colors.btn_color_1 + '", endColorstr="' + website_colors.btn_color_2 + '", GradientType=0); \
		padding:    15px 15px; \
		cursor:     pointer; \
		color:      ' + website_colors.btn_text + '; \
		} \
	</style>';
	$( blubtn ).appendTo( 'head' );

};
var SetListings = function () {

	var $ = jQuery;
	for ( i in _RawListingData ) {
		var mls = _RawListingData[ i ].mls_id;
		ListingData[ mls ] = _RawListingData[ i ];
		if ( $.inArray( mls, ListingOrder ) == -1 ) {
			ListingOrder.push( mls );
		}
	}
	if ( true == ModalEnabled ) {
		$( document ).on( 'click', '.property-entry a:not( .similar-listing ), .property-listing:not( .similar-listing ), .full-detail.grid-listing, .property-grid a', function ( e ) {
			if ( (  $( this ).hasClass( 'property-listing' ) || String( $( this ).prop( 'href' ) ).indexOf( 'mls' ) > - 1 ) ) {
				e.preventDefault();
				Favorites = g_user_data.favorites;
				if ( ! $( this ).hasClass( 'property-listing' ) ) {
					var href = $( this ).prop( 'href' );
					var mls = getMlsFromString( href );
					$( this ).prop( 'href', '#' ).attr( 'href', '#' );
					$( this ).attr( 'link', href );
					$( this ).data( 'mls', mls.mls )
						.prop( 'id', mls.id )
						.prop( 'href', '#' )
						.data( 'isSimilar', false )
						.addClass( 'property-listing' );
				}
				runPDM( $( this ) );
			}
		} );
	}
};


function getMlsFromString( str ) {
	if ( String( str ).indexOf( 'mls' ) > - 1 ) {
		var match = str.match( /mls(.*?)\// );
		var mls = match[ 1 ];
		var match = str.match( /mls.*?\/(.*?)$/ );
		var feed = match[ 1 ];
		return { mls: mls, feed: feed, id: feed + "-" + mls };
	}
};



var runPDM = function( obj, isSingle ) {
	if ( obj.hasClass( 'pdm-property-details' ) ) {
		//obj.property_details( 'destroy' );
		return;
	}
	var options = {};
	if ( isSingle ) options.singleListing = true;
	obj.property_details( options );
};

var markerClickCustom = function( marker, event, context ) {
	if ( true == PDM ) {
		jQuery( '#map-listing-tile' ).remove();
		runPDM( jQuery( '.mls-' + context.data.mls_number ).eq( 0 ) );
	}

};


( function ( $, undefined ) {


	var _running = null;

	$.widget( "pdm.property_details", {
		options               : {
			data      : {}, // raw data of listing
			listing   : {}, // Listings object
			mls       : null,
			initiated : false,
			similarListing : false,
			original : null,
			singleListing : null,
			popl : {},
			mapRendered : false


		},
		_isReloading : false,
		_modal : $( '#property-detail-modal' ),
		_property             : {}, // Property object ( with Agent and Office )
		_create               : function () {

			if ( this.element == _running ) return;
			_running = this.element;
			var self = this;
			this.element.addClass( 'pdm-property-details' );
			this.options.mls = this.element.data( 'mls' );
			this.options.similarListing = this.element.data( 'isSimilar' );
			if ( !this.options.mls ) {
			//	alert( "No MLS ID present in instantiation. Aborting" );
				return;
			}
			this._modal = $( '#property-detail-modal' );
			this.options.listing = new Listings();
			this.options.listing.setProperty( this.options.mls, this.options.similarListing, this.options.singleListing );
			this.options.data = this.options.listing.getData();
			this._property = new Property( this.options.data );

			this._setActions();

			addr = this._property.getFullAddress();
		},
		_destroy : function() {
			this.element.removeClass( 'pdm-property-details' );
			var loc = window.location.pathname;
			if ( window.location.search ) loc += window.location.search;
			history.pushState('', document.title, loc);
			_running = null;
		},
		_viewed : function() {
			var self = this;
			var params = {
				listing_data: this._property.getListingData(),
				feed        : this._property.getFeed(),
				feed_name   : this._property.getFeed(),
				action      : 'mark_listing_viewed'
			};
			$.post( frontAjax, params, function ( data ) {
				if( data.success ) {
					$( '#recent-panel .container .section .carousel-row .properties-carousel' ).html( data.recent_panel );
					$( '#activities-panel .container .section .carousel-row .properties-carousel' ).html( data.activities_panel );
					$( '#favorites-panel .container .section .carousel-row .properties-carousel' ).html(data.favorites_panel );

					$( '.activity-bar .recent-properties.number' ).html( '<span>' + data.num_recent + '</span>' );
					$( '.activity-bar .favourites.number' ).html( '<span>' + data.num_favorites + '</span>' );
					$( '.activity-bar .last-search.number' ).html( '<span>' + data.num_searches + '</span>' );

					if ( undefined != data.pop_ld && '1' == data.pop_ld.pop ) {

						$( '#mask_listing-detail' ).fadeIn();
						$( '#listing-detail-popover' ).fadeIn();

						if ( '0' == data.pop_ld.force )
							$('#listing-detail-popover').append('<a href="#" class="close-popup">close</a>');

						if ( $( '#search-results-popover' ).is( ':visible' ) ) {
							$( '#mask_search-results' ).trigger( 'click' );
						}

						if (/MSIE/.test(navigator.userAgent) || /Trident\/7\./.test( navigator.userAgent ) ) {
							$( '#property-detail-modal' ).hide();
						}

						$( document ).on( 'click', '#listing-detail-popover .close-popup, #mask_listing-detail, #search-results-popover .close-popup, #mask_search-results', function( e ) {
							e.preventDefault();
							$('#mask_listing-detail').hide();
							$('#listing-detail-popover').fadeOut();
							if ( /MSIE/.test( navigator.userAgent ) || /Trident\/7\./.test( navigator.userAgent ) ) {
								$( '#property-detail-modal' ).show();
							}
							if ( 'registered' != $( this ).data( 'state' ) && 1 == data.pop_ld.force ) {
								self._destroy();
								$( '.close-btn img', self._modal ).trigger( 'click' );
							}
						});

					}
				}
			}, 'json' );
		},
		_setActions : function() {


			// PDM Navigation
			//----------------------------------
			this._on( '#listing-prev', { click: this._previous } );
			this._on( '#listing-next', { click: this._next } );

			// Print button Click
			//----------------------------
			this._on( '#print-button', { click : this._print } );

			// Contact Button Click
			//-----------------------------------
			this._on( '#contact-button', { click: "_contact" } );

			// Calculator Click
			//----------------------------------
			this._on( '.calculator-btn', { click : "_calculator" } );

			// Directions
			//----------------------------------
			this._on( '.direction-btn, .directions-btn', { click: "_directions" } );


			// Favorite Property
			//--------------------------
			this._on( '.save-property-btn', { click: "_favorite" } );

			this._on( '.close-btn', { click: "_close" } );

			// Schedule Showing
			//-----------------------

         if ( 'active' == this._property.getStatus().toLowerCase() ) {
            $( '#schedule-showing-form' ).off( 'submit' );
            this._on( '#schedule-showing-form', { submit : "_showScheduleShowing" } );
            this._on( '#mask_schedule-showing, #schedule-showing-popover .close-popup', { click : "_hideScheduleShowing" } );
            this._on( '#schedule-showing-popover-form', { submit : "_submitScheduleShowing" } );

            $( '#schedule-showing' )
               .parent()
               .show();
         }


			$( '#property-directions input[type="submit"]' ).unbind( 'click' );
			this._on( '#property-directions input[type=submit]', { click: '_getDirections' } );

			$( '#property-descr, .property-descr' ).find( 'a' ).off( 'click' );
			this._on( '#property-descr, .property-descr a', { click: '_expandRemarks' } );

			this._on( 'a[data-toggle="tab"]', { click: '_mapRender' } );

			//this._on( '.close-btn img', { click: "_destroy" } );

			// 'See All Photos' click
			//-----------------------------------

			//$( document ).off( 'click', '.see-all-btn' );
			//this._on( '.see-all-btn', { click: "_viewAllPhotos" } );
			//$( '.see-all-btn', this._modal ).data( 'images', this._property.getPhotoObj().getAll() );
			/*
			$( document ).on( 'click', '.see-all-btn', this._modal, function( e ) {
				e.preventDefault();
				self._viewAllPhotos();
			});*/

			this._show();
			window.location.hash = this._property.getFeed() + "-" + this._property.getMLS();
		},
		_expandRemarks : function( e ) {
			e.preventDefault();
			if ( $( e.target ).parent( 'p' ).hasClass( 'long-details' ) ) {
				$( e.target ).parents( 'div' ).find( '.short-details' ).show();
				$( e.target ).parents( 'div' ).find( '.long-details' ).hide();
			} else {
				$( e.target ).parents( 'div' ).find( '.short-details' ).hide();
				$( e.target ).parents( 'div' ).find( '.long-details' ).show();
			}
		},
		_directions : function (e ) {
			$('#tabs-btns li').eq(1).find('a').click();
		},
		_getDirections : function( e ) {
			e.preventDefault();
			$( '#property-map' ).gmap3( 'destroy' );
			$("#property-map").gmap3({
				getroute:{
					options:{
						origin:$('#user-addr').val(),
						destination:this._property.getFullAddress(),
						travelMode: google.maps.DirectionsTravelMode.DRIVING
					},
					callback: function(results){
						if (!results) return;
						$(this).gmap3({
							map:{
								options:{
									zoom: 13
								}
							},
							directionsrenderer:{
								container: '#property-maps-list',
								options:{
									directions:results
								}
							}
						});
					}
				}
			});
		},
		_close : function( e ) {
			e.preventDefault();
			$( '#property-detail-modal' ).modal( 'hide' );
         $( '#schedule-showing' ).parent().hide();
			this.element.property_details( 'destroy' );
		},
		_getBody : function() {
			var self = this;
			var params = {
				action : "get_property_modal",
				mls    : this._current
			};
			$.post( frontAjax, params, function ( data ) {
				$( '.modal-body', '#property-detail-modal' ).html( data.html );
				self._setActions();
			}, 'json' );
		},
		_load : function( mls, isSimilar ) {
			this._isReloading = true;
			if ( true == isSimilar ) {
				if ( ! this.options.original ) {
					this.options.original = this.options.mls;
				}
			} else {
				this.options.original = null;
			}
			this.options.mls = mls;
			this.options.similarListing = ( true == isSimilar ) ? true : null;
			this.options.listing = new Listings();
			this.options.listing.setProperty( this.options.mls, this.options.original );
			this.options.data = this.options.listing.getData();
			this._property = new Property( this.options.data );


			this._populate();
		},
		_previous : function() {
			this.options.similarListing = false;
			var prev = this.options.listing.getPrevious();
			if ( prev ) this._load( prev );
		},
		_next : function() {
			this.options.similarListing = false;
			var next = this.options.listing.getNext();
			if ( next ) this._load( next );
		},
		_show                 : function () {
			var self = this;

			$( '#property-detail-modal' ).one( 'shown.bs.modal', function () {
				self._populate();

			} ).on( 'hidden.bs.modal', function() {
				self._destroy();
			} );
			$( '#property-detail-modal' ).one( 'show.bs.modal', function() {
			//	$('body').addClass("modal-open-noscroll");
			});

			$( '#property-detail-modal' ).modal( {
				show:true,
				keyboard:true,
				backdrop: true
			} );
		},
		_favorite : function( e ) {
			e.preventDefault();
			var self = this;

			var star_icon = $( e.target ).find('.favorite-icon');
			var mls_num = this._property.getMLS();
			var feed = this._property.getFeed();
			var listing_data = this._property.getListingData();

			if ( ! $.isEmptyObject( Favorites ) ) {
				if ( '1' == g_user_data.pop_fav.pop ) {
					$('#mask_favorite-listing').fadeIn();
					$('#favorite-listing-popover').fadeIn();
				}
			}

			if ( ! star_icon.hasClass( 'active' ) ) {
				star_icon.addClass('active');
				$('#details-head .save-property-btn .btn-text').html('un-save property');
				var current_number = $('.activity-bar .favourites.number span').html();
				current_number++;
				$('.activity-bar .favourites.number span').html( current_number );
				$.post( frontAjax, { action: 'set_fav', listing_data : listing_data, feed : feed }, function( data ) {
					if ( data.success ) {
						$('#favorites-panel .container .section .carousel-row .properties-carousel').prepend( data.property_box );
						$( '.favorite-icon' ).addClass( 'active' );

						$( '.favorite-listing-popover-form' ).on( 'submit', function( e ) {

						});


					}
				}, 'JSON' );
			} else {
				star_icon.removeClass('active');
				var current_number = $('.activity-bar .favourites.number span').html();
				current_number--;
				$('.activity-bar .favourites.number span').html( current_number );
				$.post( frontAjax, { action: 'rem_fav', listing_data: listing_data, feed : feed } );

			}
		},
		_print                : function ( e ) {
			var styles = [];
			var script = [];
			$( 'link' ).each( function () {
				if ( $( this ).prop( 'rel' ) == "stylesheet" ) {
					styles.push( $( this ).prop( 'href' ) );
				}
			} );
			var print_options = $( '#print-button' ).data( 'print-option' );
			if ( ! print_options ) print_options = {};

			var html = "<html lang='en-US'><head>";
			if ( styles.length > 0 ) {
				var theme_style = null;

				for ( var i = 0; i < styles.length; i++ ) {
					//if ( String( styles[ i ] ).indexOf( "property-detail" ) == -1 ) {
					if ( String( styles[ i ] ).search( /theme(\d{1})\/style\.css/ ) != -1
						&& print_options.hasOwnProperty( 'styleAfterPrint') && true == print_options.styleAfterPrint) {
						theme_style = "<link rel='stylesheet' type='text/css' href='" + styles[ i ] + "'  />";
					} else {
						html += "<link rel='stylesheet' type='text/css' href='" + styles[ i ] + "'  />";
					}
					//}
				}
				if ( null != theme_style ) html += theme_style;
			}

			html += "" +
			'<meta charset="UTF-8" />' +
			"<script type='text/javascript' src='/wp-includes/js/jquery/jquery.js?ver=1.11.0'></script>" +
			"<script type='text/javascript' src='/wp-includes/js/jquery/jquery-migrate.min.js?ver=1.2.1'></script>" +
			"<script type='text/javascript' src='http://code.jquery.com/ui/1.10.3/jquery-ui.js?ver=3.9.1'></script>";
			html += "<style type='text/css'>" +
			".modal-print { " +
			"display:block !important; " +
			"} " +
			"@page { " +
			"margin: 0; " +
			"size: A4; " +
			//"min-height: 27.6cm; " +
			"} " +
			"body { " +
			"margin: 1.6cm; " +
			"}</style>";

			html += '<meta name="google-site-verification" content="-b4Pe8n03lsNC5BoBygZD0oPiKjWvF5pZhYAN8jnQwo" /><!--[if lt IE 9]><script src="//html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->';
			html += "</head>";

			var mp = $( '.modal-print' ).clone();
			html += "<body>" + mp.wrap( '<p/>' ).parent().html() +

			"<script type='text/javascript' src='/wp-includes/js/jquery/ui/jquery.ui.core.min.js?ver=1.10.4'></script>" +
			"<script type='text/javascript' src='/wp/wp-content/mu-plugins/pdm-wp/assets/scripts/theme/bootstrap.js?ver=1.0.0'></script>" +
			"<script type='text/javascript' src='/wp/wp-content/mu-plugins/pdm-wp/assets/scripts/theme/plugins.js?ver=1.0.0'></script>" +
			"<script type='text/javascript' src='http://maps.google.com/maps/api/js?sensor=false&language=en&ver=1.0.0'></script>" +
			"<script type='text/javascript' src='/wp/wp-content/mu-plugins/pdm-wp/assets/scripts/theme/markerwithlabel.js?ver=1.0.0'></script>" +
			"";
			html += "<script type='text/javascript'> \n \
			var addr = '" + this._property.getFullAddress() + "'; \n \
			var latlong = '" + this._property.getLongitude() + "," + this._property.getLatitude() + "';\n";
			/*
			html += "jQuery( '.property-map_' ).gmap3( { \
					marker:{ \
						address:addr , \
						options:{ \
							icon: 'http://s3.amazonaws.com/cdn/themes/common/small-marker.png' \
						} \
					}, \
					map:{ \
						options:{ \
							zoom: 14 \
						} \
					} \
				}); \
				window.onload = function() { \
					window.print(); \
				} \
				";
				*/
			var address = encodeURIComponent( this._property.getFullAddress() );
			var image = "http://maps.googleapis.com/maps/api/staticmap?center=" + address + "&zoom=13&size=480x480&maptype=roadmap&markers=" + this._property.getLatitude() + "," + this._property.getLongitude();
			html += "jQuery( '.property-map' ).html( '<img src=\"" + image + "\" />' );";

			html += "window.onload = function() { \
					window.print(); \
					window.close(); \
				}";


			html += "</script>";
			html += "</body>";
			html += "</html>";

			var WinPrint = window.open( '', '', 'left=0,top=0,width=1000,height=900,toolbar=0,scrollbars=0,status=0' );
			WinPrint.document.write( html );
			WinPrint.document.close();
			WinPrint.focus();

		},
		_contact              : function () {
			$( '#pdm-message' ).focus();
		},
		_calculator           : function ( e ) {
			var self = this;
			e.preventDefault();
			var calc_options = $( 'a.calculator-btn', this._modal ).data( 'options' );
			calc_options = calc_options ? calc_options : {};
			$.post( frontAjax, { action : "get_mortgage_calculator" }, function ( data ) {
				bootbox.dialog( {
					message : data.html,
					title   : 'Mortgage Calculator',
					className: 'calculator-modal',
					backdrop: ( true == calc_options.modalOnTop ? false : true ),
					buttons : {
						close : {
							label    : "Close",
							callback : function () {
							}
						}
					}

				} ).on( 'shown.bs.modal', function() {
					$( '#month' ).val( new Date().getMonth() + 1 );
					$( '#year' ).val( new Date().getFullYear() );
					$( '#amount' ).val( self._property.getPrice() );
					$( '#interest' ).val( MortgageCalculatorSettings.interest_rate );
					$( '#monthly-yearly' ).val( MortgageCalculatorSettings.terms ).trigger( 'change' );
					switch ( MortgageCalculatorSettings.terms ) {
						case "years":
							$( '#term-years' ).val( MortgageCalculatorSettings.terms_period ).trigger( 'keyup' );
							break;
						case "months":
							$( '#term-months' ).val( MortgageCalculatorSettings.terms_period ).trigger( 'keyup' );
							break;
					}



				});
				if ( calc_options.hasOwnProperty( 'modalOnTop' ) && true == calc_options.modalOnTop ) {
					$( '.calculator-modal' ).css( 'z-index', '9040' );
				}
			}, 'json' );
		},
		_resetPropertyAgent : function( agent ) {
			this.options.data.agent = agent;
			this._property = new Property( this.options.data );
			this._populate();
		},
		_writeFeaturedAgent   : function () {
			$( '.modal-featured-agent' ).html( '' );
			var params = {
				agent_id : this._property.getAgent() ? this._property.getAgent().getId() : null,
				action: "get_featured_agent"
			};
			var self = this;
			$.post( frontAjax, params, function ( data ) {
				$( '.modal-featured-agent' ).html( data.html );
				FeaturedAgent = data.json;
				if ( FeaturedAgent.id != self._property.getAgent().getId() ) {
					self._resetPropertyAgent( data.json );
				}

				var fa = $( '[name=assigned_agent_id]', self._modal ).val();
				$( '.frm-featured-agent-msg', self._modal ).prop( 'id', 'pdm-featured-agent-' + fa );

				$( '[id^="fam-"]', self._modal ).each( function() {
					var id = $( this ).prop( 'id' );
					id = id.replace( /fam/, 'pdm' );
					$( this ).prop( 'id', id );
					updateFeaturedAgentForm();
				});

			}, 'json' );
		},
		_writeSimilarListings : function () {

			if ( 1 != SimilarListingsSettings.active ) return;
			var self = this;
			SimilarListingsSettings.price_threshold = SimilarListingsSettings.price_threshold || 20;
			SimilarListingsSettings.radius = SimilarListingsSettings.radius || 20;
			SimilarListingsSettings.count = SimilarListingsSettings.count || 5;

			$( '.modal-similar-listings' ).html( '' );
			if ( this._property.getPrice() ) {
				var price = parseInt( this._property.getPrice() );
				var adjuster = parseInt( SimilarListingsSettings.price_threshold ) / 100;
				var diff = price * adjuster;
				var min_price = price - diff;
				var max_price = price + diff;
				var point = "POINT(" + this._property.getLongitude() + "," + this._property.getLatitude() + ")";

				var params = {
					search_params : {
						primary_criteria : '',
						search_type      : 'point',
						min_price        : min_price,
						max_price        : max_price,
						order            : "distance",
						exclude          : this._property.getMLS(),
						radius           : SimilarListingsSettings.radius,
						listing_count    : SimilarListingsSettings.count,
						point: point

					},
					action           : 'get_similar_listings'
				};

				$.post( frontAjax, params, function ( data ) {
					if ( 0 == data.error ) {
						$( '.modal-similar-listings' ).html( data.html );
						SimilarListings = {};
						for( var i in similar_listings ) {
							SimilarListings[ similar_listings[ i ].mls_id ] = similar_listings[ i ];
						}
						// Set Similar Listings
						//--------------------------------
						$( '.properties-featured', self._modal ).each( function () {
							$( this ).featured_listing();

							$( '.properties-featured a', self._modal ).each( function() {
								var href = $( this ).prop( 'href' );
								if (  String( href ).indexOf( 'mls' ) > -1 ) {
									$( this ).prop( 'href', '#' ).attr( 'href', '#' );
									$( this ).attr( 'link', href );
									var mls = getMlsFromString( href );
									$( this ).data( 'mls', mls.mls )
										.prop( 'id', mls.id )
										.data( 'isSimilar', true )
										.addClass( 'property-listing similar-listing modal-property' )
										.on( 'click', function( e ) {
											e.preventDefault();
											self._load( $( this ).data( 'mls' ), true );
										});
								}
							});
						} );

					}
				}, 'json' );
			}
		},
		_getData              : function () {
			return this.options.data;
		},
		_populate             : function () {
			this._viewed();
			var self = this;
			this.options.popl = new Populate( this._getData() );
			this.options.popl.run();

			if ( 1 != MortgageCalculatorSettings.active ) $( '.calculator-btn', this._modal ).hide();
			setTimeout(	function() {
				self._post()
			}, 100 );
		},
		_saveProperty         : function ( e ) {
			var star_icon = $( this ).find( '.icon-star' );

			var mls_num = this._property.getMLS();
			var feed = this._property.getFeed();


			if ( undefined != mls_num && '' != mls_num ) {

				if ( undefined != g_user_data && undefined != g_user_data.pop_fav ) {

					if ( '1' == g_user_data.pop_fav.pop ) {
						$( '#mask_favorite-listing' ).fadeIn();
						$( '#favorite-listing-popover' ).fadeIn();
					}

				}

				if ( !star_icon.hasClass( 'active' ) ) {

					star_icon.addClass( 'active' );
					//$('#details-head .save-property-btn .btn-text').html('un-save property');
					var current_number = $( '.activity-bar .favourites.number span' ).html();
					current_number++;

					$( '.activity-bar .favourites.number span' ).html( current_number );

					$.post( frontAjax, { action : 'set_fav', listing_data : listing_data, feed : feed }, function ( data ) {

						if ( data.success ) {
							$( '#favorites-panel .container .section .carousel-row .properties-carousel' ).prepend( data.property_box );
						}

					}, 'JSON' );
				} else {

					star_icon.removeClass( 'active' );
					$( '#details-head .save-property-btn .btn-text' ).html( 'save this property to my account' );
					var current_number = $( '.activity-bar .favourites.number span' ).html();
					current_number--;
					$( '.activity-bar .favourites.number span' ).html( current_number );

					$.post( frontAjax, { action : 'rem_fav', listing_data : listing_data, feed : feed } );

				}
			}
		},
		_resetModal           : function () {

		},
		_viewAllPhotos : function( e ) {
			if ( e ) e.preventDefault();
			var images = this._property.getPhotoObj().getAll();

			$.iLightBox( images, {
				skin      : 'light',
				startFrom : 1,
				path      : 'horizontal',
				slideshow : {
					pauseOnHover : true
				}
			} );
		},
		_post                : function () {
			var self = this;

			// Set MLS ID & Feed on 'Favorite' button
			//-----------------------------------------
			this._modal.find( '.save-property-button' ).attr( 'data-mls', this._property.getMLS() ).attr( 'data-feed', this._property.getFeed() );


			this._setSlideshow();

			// Set datepicker on schedule date
			//-----------------------------------
			var dte = new Date();
			var month = dte.getMonth() + 1;
			var day = dte.getDate();
			var year = dte.getFullYear();
			this._modal.find( 'input[name=schedule-date]' ).datepicker( {
				defaultDate: "m/d/yy"
			} ).val(month + "/" + day + "/" + year );

			// Set Maps
			//---------------------
			this._setMaps();

			// Set Graphs
			//---------------------
			this._setGraphs();

			// Write 'Similar Listings' to modal
			//--------------------------------
			this._writeSimilarListings();

			// Write 'Featured Agent' to modal
			//--------------------------------
			this._writeFeaturedAgent();

			$( '.save-property-btn' ).each( function() {
				$( this ).attr( 'data-mls', self._property.getMLS() );
				$( this ).attr( 'data-feed', self._property.getFeed() );
			});
			if ( $.inArray( this._property.getMLS(), Favorites ) > -1 ) {
				$( '.favorite-icon', this._modal ).addClass( 'active' );
			} else {
				$( '.favorite-icon', this._modal ).removeClass( 'active' );
			}

			a2a_config.linkurl =  this._property.getUrl();
			a2a_config.tracking_callback = {
				ready : function () {
					a2a.init( 'page' );
				}
			};
			$.getScript( '//static.addtoany.com/menu/page.js' );
			this._isReloading = false;

		},
		_setGraphs : function() {
			// Set Market graphs
			//------------------------------
			$( ".market-box", this._modal ).each( function () {
				var currentBox = $( this );
				currentBox.find( ".iframe-wrapper" ).html( '<div class="loader" style="width: 521px; height: 241px; text-align: center; vertical-align: middle; display: table-cell;"><img src="http://s3.amazonaws.com/cdn/themes/common/ajax_loader_gray_128.gif" style="width: 128px; height: 128px;" /></div>' );
				var url = $( this ).attr( 'data-chart-url' );

				if ( undefined != url ) {
					var img = new Image();
					img.src = url;
					img.onload = function () {
						currentBox.find( ".iframe-wrapper" ).html( img );
					}
				}
			} );
		},
		_mapRender : function() {

			if( true == this._isReloading || false == this.options.mapRendered ) {
				var addr = this._property.getFullAddress();
				this.options.mapRendered = true;
				$( '#user-addr' ).val( '' );
				$( '#property-maps-list' ).html( '' );
				$( ".property-map", this._modal ).gmap3( 'destroy' );
				$( ".property-map", this._modal ).gmap3( {
					marker: {
						address: addr,
						options: {
							icon: "http://s3.amazonaws.com/cdn/themes/common/small-marker.png"
						}
					},
					map   : {
						options: {
							zoom: 14
						}
					}
				} );
			}
		},
		_setMaps : function( ) {
			// Set Google Map Show On 'Map' click
			//-----------------------------------
			var self = this;
			if ( $( 'a[href="#map-tab"]' ).parent( 'li' ).hasClass( 'active' ) ) {
				this._mapRender();
			}


			// Set School & Walkability Maps
			//------------------------------------

			$( '.schools-data', this._modal ).each( function () {
				var currentBox = $( this );
				var url = $( this ).attr( 'data-map-url' );

				if ( undefined != url ) {
					var iframe = '<iframe class="greatschools" name="greatSchools" src="' + url + '" style="width: 100%; height: 100%; max-width: none;" marginheight="0" marginwidth="0" frameborder="0" scrolling="no"></iframe>';

					currentBox.find( ".iframe-wrapper" ).html( iframe );

				}

			} );
		},
		_setSlideshow : function( ) {
			var self = this;
			//  Set Cycle2 Slideshow
			//------------------------------
			var photos = [];
			var justPhotos = [];
			if ( this._property.photos.hasPhotos() ) {
				for( var i=0; i<this._property.photos.getPhotoCount(); i++) {
					var ph = this._property.photos.getAll();
					var photo = ph[ i ];
					photos.push( '<div class="slideshow-images-outer"><div class="slideshow-images-inner"><img src="' + photo + '" /></div></div>' );
					justPhotos.push( '<img src="' + photo + '" />' );
				}
			}

			$( '.primary-slideshow-photo', '.details-slideshow' ).remove();
			$( '.pdm-photo-holder', this._modal ).remove();
			$( '.cycle-slide', this._modal ).remove();
			$( '#m' + this._property.getMLS() ).html( '' );
			$( '#pdm-' + this._property.getMLS() ).html( '' );


			if ( this._property.photos.getPrimary() ) {
				$( "<div class='slideshow-images-outer primary-slideshow-photo'> \
					<div class='slideshow-images-inner'> \
						<img id='m" + this._property.getMLS() + "-primary' src='" + this._property.photos.getPrimary() + "' /> \
					</div> \
				</div>" ).prependTo( '.details-slideshow', this._modal );
				justPhotos.unshift( '<img src="' + this._property.photos.getPrimary() + '" />' );

			}
			if ( photos.length > 0 ) {
				var allphotos = photos.join('\n---\n' );
				$( allphotos ).appendTo( '#m' + this._property.getMLS(), this._modal );
				$( '#pdm-' + this._property.getMLS() ).html( justPhotos.join( '\n' ) );
				//$( '#m' + this._property.getMLS(), this._modal ).append( allphotos );
			}
			this._modal.find( '.details-slideshow' ).cycle( 'destroy' );
			this._modal.find( '.details-slideshow' ).cycle( );

			this._modal.find( '.modal-slideshow-controls .slideshow-prev' ).on( 'click', function() {
				//self._modal.find( '.details-slideshow' ).cycle( 'prev' );
			});

			this._modal.find( '.modal-slideshow-controls .slideshow-next' ).on( 'click', function() {
				//self._modal.find( '.details-slideshow' ).cycle( 'next' );
			});

			if ( $( '#' + this._property.getMLS() ).size() == 0 ) {
			//	$( '#m' + this._property.getMLS() ).prop( 'id', this._property.getMLS() );
			}
		},
		_hideShowRemarks     : function ( e ) {
			if ( $( e.target ).hasClass( 'short-details' ) ) {
				$( '.short-details' ).hide();
				$( '.long-details' ).show();
			} else {
				$( '.long-details' ).hide();
				$( '.short-details' ).show();
			}
		},

		// Show Schedule Showing
		//--------------------------
		_showScheduleShowing : function ( e ) {
			var data = $( e.target ).serializeArray();
			var fields = $( '#schedule-showing-popover-form' ).serializeArray();
			for ( var i in data ) {
				switch ( data[ i ].name ) {
					case 'schedule-date':
						$( '#schedule-showing-popover #schedule-date' ).val( data[ i ].value );
						break;
					case 'schedule-time':
						$( '#schedule-showing-popover #schedule-time' ).val( data[ i ].value );
						break;
				}
			}
			if ( undefined != g_user_data && null != g_user_data ) {
				if ( undefined != g_user_data.login && '' != g_user_data.login ) {
					for ( var i in fields ) {
						if ( fields[ i ].name != 'showing_date' && fields[ i ].name != 'showing_time' ) {
							$( '#schedule-showing-popover-form input[name="' + fields[ i ].name + '"]' ).remove();
						}
					}
				}
			}

			var notes = 'I would like see ' + this._property.getAddress() + ' (mls # ' + this._property.getMLS() + ') sometime in the ' + $( '#schedule-showing-popover #schedule-time' ).val() + ' on ' + $( '#schedule-showing-popover #schedule-date' ).val();
			$( '#showing_notes' ).html( notes );
			$( '#mask_schedule-showing' ).fadeIn();
			//var scrolledTo = $( window ).scrollTop();
			//$( '#schedule-showing-popover' ).css( 'top', (scrolledTo + 110) + 'px' );
			$( '#schedule-showing-popover' ).fadeIn();
			if ( typeof scheduleShowingCustom == "function" ) scheduleShowingCustom();
			e.stopImmediatePropagation();
			return false;
		},
		_hideScheduleShowing : function () {
			$( '#mask_schedule-showing' ).fadeOut();
			$( '#schedule-showing-popover' ).fadeOut();
		},
		_submitScheduleShowing : function ( e ) {
			e.preventDefault();
			var valid = validate( $( e.target ) );

			if ( valid ) {
				var params = obj.serialize();
				params += '&action=reg_u_showing&';
				params += $.param( self._listing );

				$.post( frontAjax, params, function ( user_data ) {

					// Set their cookie and refresh.
					if ( user_data.success ) {

						// 1. Update the activity bar items.
						$( '#recent-panel .container .section .carousel-row .properties-carousel' ).html( user_data.recent_panel );
						$( '#activities-panel .container .section .carousel-row .properties-carousel' ).html( user_data.activities_panel );
						$( '#favorites-panel .container .section .carousel-row .properties-carousel' ).html( user_data.favorites_panel );

						if ( undefined !== user_data.login ) {
							update_activity_bar();
						} else {
							$( '.activity-bar .signin' ).html(
								'Hi, Sign in.<br><span>( my account )</span>'
							);
						}

						$( '.activity-bar .recent-properties.number' ).html( '<span>' + user_data.num_recent + '</span>' );
						$( '.activity-bar .favourites.number' ).html( '<span>' + user_data.num_favorites + '</span>' );
						$( '.activity-bar .last-search.number' ).html( '<span>' + user_data.num_searches + '</span>' );

						// 2. Look for mls numbers on the page and change the starts to golden vs not.
						$( '.property-box' ).each( function ( index ) {

							if ( '' != $( this ).attr( 'data-mls' ) ) {
								if ( $.inArray( $( this ).attr( 'data-mls' ), user_data.favorites ) ) {
									$( this ).find( '.favourite' ).addClass( 'active' );
								}
							}
						} );

						// Hide the "This is your password" verbiage on popovers
						$( '.reg-home-phone' ).prop( 'placeholder', 'phone' );

						// if website setting has Google Adwords Conversion Code, track this conversion
						if ( undefined !== g_user_data.gc_track_id ) {

							var image = new Image( 1, 1 );
							image.src = "http://www.googleadservices.com/pagead/conversion/" + g_user_data.gc_track_id + "/?value=0&label=" + g_user_data.gc_track_label + "&script=0";

						}

					} else {
						$( '.activity-bar .signin' ).html(
							'Hi, Sign in.<br><span>( my account )</span>'
						);
					}


				}, 'JSON' );

				$( '#schedule-showing-popover' ).html(
					"<h2>All Done!</h2>" +
					"<p>Thanks, I've got you down for sometime in the " + $( '#schedule-showing-popover #schedule-time' ).val() + " on " + $( '#schedule-showing-popover #schedule-date' ).val() + ".  I'll send you another notification to confirm the appointment shortly.</p>" +
					'<a href="#" class="close-popup">close</a>'
				);
			}
		}
	} );


	var SearchViews = function ( options ) {
		this._options = options;
	};
	SearchViews.prototype.listView = function () {

	};
	SearchViews.prototype.mapView = function () {

	};
	SearchViews.prototype.galleryView = function () {

	};


	$.widget( "pdm.search", {
		options         : {
			total         : 0,
			search_hash   : null,
			search_header : null,
			results       : {},
			current       : {},
			page          : 1,
			idx_data      : {},
			frontAjax      : null
		},
		_create         : function () {
			this.options.idx_data = idx_data;
			this.frontAjax = frontAjax;
		},
		_getResults     : function () {
			$.post( this.options.frontAjax, { action : 'lazy_search', idx_data : this.options.idx_data }, $.proxy( this._processResults, this ) );
		},
		_processResults : function ( results ) {
			if ( 1 == results.success ) {
				this.options.total = results.total_results;
				this.options.search_hash = results.search_hash;
				this.options.search_header = results.search_header;
				this.options.results = results.list_results;
			}
		}
	} );

	var Populate = function ( data ) {
		this._field = null;
		this._value = null;
		this._data = data;
		this._obj = null;
		this._fields = [];
		this._attrs = [];
		//this.setObj();
	};


	Populate.prototype.resetAll = function() {
	};

	Populate.prototype.reset = function () {
		this._field = null;
		this._value = null;
	};
	Populate.prototype.options = function () {
		if ( this._obj.data( 'options' ) ) {
			var options = this._obj.data( 'options' );
			for ( var i in options ) {
				switch ( i ) {
					case "prependToValue":
					case "appendToValue":

						for ( var kField in options[ i ] ) {

							if ( kField == this._field ) {
								if ( i == "prependToValue" ) {
									this._value = options[ i ][ kField ] + this._value;
								} else {
									this._value = this._value + options[ i ][ kField ];
								}
								//this._value = ( i == "prependToValue" ? options[ i ][ kField ] + this._value : this._value + options[ i ][ kField ] );
							}
						}
						break;
					case "hideOnNull":
						var hidden = ( !this._value || this._value == null ) ? true : false;
						switch ( options[ i ] ) {
							case "this":
								hidden ? this._obj.hide() : this._obj.show();
								break;
							case "parent":
								hidden ? this._obj.parent().hide() : this._obj.parent().show();
								break;
						}
						break;
					case "truncate":
						this._value = String( this._value ).substring( 0,options[ i ] );
						break;
				}
			}
		}
	};
	Populate.prototype.run = function() {
		var self = this;
		$( '[data-field], [data-populate-attr]' ).each( function () {
			self._obj = $( this );
			self.reset();
			self.setObj();
		} );
	};

	Populate.prototype.setObj = function () {
		this.setField();
		this.setAttributes();
	};

	Populate.prototype.setField = function () {
		if ( this._obj.data( 'field' ) ) {
			this.reset();
			this.addToField( this._obj.data( 'field' ) );
			this.getValue( this._obj.data( 'field' ) );
			this._obj.html( this._value );
		}
	};
	Populate.prototype.addToField = function( field ) {
		this._field = field;
		if ( $.inArray( this._field, this._fields ) == -1 ) {
			this._fields.push( this._field );
		}
	};

	Populate.prototype.addToAttr = function( field ) {
		this._field = field;
		if ( $.inArray( this._field, this._attrs ) == -1 ) {
			this._attrs.push( this._field );
		}
	};

	Populate.prototype.getValue = function ( field ) {
		if ( String( field ).indexOf( '.' ) > 0 ) {
			var fields = field.split( '.' );
			this._value = this._data[ fields[ 0 ] ][ fields[ 1 ] ];
		} else {
			this._value = this._data[ field ];
		}
		this.options();
		this.format();
	};

	Populate.prototype.setAttributes = function () {
		if ( this._obj.data( 'populate-attr' ) ) {
			var attrs = this._obj.data( 'populate-attr' );
			for ( var i in attrs ) {
				this.reset();
				this.addToAttr( attrs[ i ] );
				this.getValue( attrs[ i ] );
				this._obj.attr( i, this._value );

			}
		}
	};
	Populate.prototype.format = function () {
		if ( this._obj.data( 'format' ) ) {
			value = this._value;
			switch ( this._obj.data( 'format' ) ) {
				case "currency":
					value = Number( value ).formatCurrency( 0 );
					break;
				case "capitalize":
					value = String( value ).capitalize();
					break;
			}
			this._value = value;
		}
	};


	var Agent = function ( data ) {
		this._data = data;
		this.getFirstName = function () {
			return this._data.first_name;
		};
		this.getLastName = function () {
			return this._data.last_name;
		};
		this.getName = function () {
			return this._data.name;
		};
		this.getId = function () {
			return this._data.id;
		};
		this.getEmail = function () {
			return this._data.email;
		};
		this.getWebsiteUrl = function () {
			return this._data.website;
		};
		this.getPhoto = function () {
			return this._data.photo;
		};
		this.getFacebookUrl = function () {
			return this._data.facebook;
		};
		this.getTwitterUrl = function () {
			return this._data.twitter;
		};
		this.getLinkedinUrl = function () {
			return this._data.linkedin;
		};
		this.getOfficeId = function () {
			return this._data.office_id;
		};
		this.getOfficeMlsId = function () {
			return this._data.office_mls_id;
		};
		this.getTitle = function () {
			return this._data.title;
		};
		this.hasTitle = function () {
			return "undefined" != typeof this._data.title ? true : false;
		};
		this.getMlsId = function () {
			return this._data.mls_id;
		};
		this.getBio = function () {
			return this._data.bio;
		};
		this.getCredentials = function () {
			return this._data.credentials;
		};
		this.getSignature = function () {
			return this._data.signature;
		};
		this.getLastLogin = function () {
			return this._data.last_login;
		};
		this.getCellPhone = function () {
			return this._data.cell_phone;
		};
		this.getWorkPhone = function () {
			return this._data.work_phone;
		};
	};

	var Office = function ( data ) {
		this._data = data;
		this.getId = function () {
			return this._data.id;
		};
		this.getAddress = function () {
			return this._data.address;
		};
		this.getCity = function () {
			return this._data.city;
		};
		this.getState = function () {
			return this._data.state;
		};
		this.getZip = function () {
			return this._data.zip;
		};
		this.getFullAddress = function () {
			return this._data.full_address;
		};
		this.getName = function () {
			return this._data.name;
		};
		this.getLatitude = function () {
			return this._data.latitude;
		};
		this.getLongitude = function () {
			return this._data.longitude;
		};
		this.getMlsId = function () {
			return this._data.mls_id;
		};
		this.getWebsiteUrl = function () {
			return this._data.website;
		};
		this.getTagline = function () {
			return this._data.tagline;
		};
		this.getPhone = function () {
			return this._data.phone;
		};
		this.getEmail = function () {
			return this._data.email;
		};
		this.getFax = function () {
			return this._data.fax;
		};
		this.getCities = function () {
			return this._data.cities;
		};
		this.getNeighborhoods = function () {
			return this._data.neighborhoods;
		};
		this.getZipcodes = function () {
			return this._data.zipcodes;
		};
		this.getSchools = function () {
			return this._data.schools;
		};
		this.getPhoto = function () {
			return this._data.photo;
		};
	};


	var Photos = function ( data ) {
		this._data = data;
		this._primary = "";
		this._other = {};
		this._otherCount = 0;
		this._totalPhotos = 0;
		this._all = [];
		this.setPrimaryPhoto = function ( photo ) {
			this._primary = photo;
			this._all.push( photo );
			this._totalPhotos++;
		};
		this.setOtherPhotos = function ( photos ) {
			if ( photos.length ) {
				for ( var i = 0; i < photos.length; i++ ) {
					this._other[ i ] = photos[ i ];
					if ( $.inArray( photos[ i ], this._all ) == -1 ) this._all.push( photos[ i ] );
					this._otherCount++;
					this._totalPhotos++;
				}
			}
		};
		this.getAll = function() {
			return this._all;
		};
		this.getPrimary = function () {
			return this._primary;
		};
		this.getOtherPhotos = function () {
			return this._other;
		};
		this.getOtherPhoto = function ( index ) {
			if ( this._other.hasOwnProperty( index ) ) return this._other[ index ];
		};
		this.hasPhotos = function() {
			if ( this._all.length > 0 ) return true;
		}
		this.getPhotoCount = function() {
			return this._all.length;
		}
	};


	var Property = function ( data ) {
		this._data = data;
		this._agent = {};
		this._office = {};

		this.photos = new Photos();
		if ( this._data.hasOwnProperty( "primary_photo" ) ) this.photos.setPrimaryPhoto( this._data.primary_photo );
		if ( this._data.hasOwnProperty( 'other_photos' ) &&  $.isArray( this._data.other_photos ) ) this.photos.setOtherPhotos( this._data.other_photos );

		this.getData = function () {
			return this._data;
		}
		this.getStatus = function () {
			return this._data.status;
		};
		this.getMLS = function () {
			return this._data.mls_id;
		};
		this.getFeed = function () {
			return this._data.mls_feed_id;
		};
		this.getCity = function () {
			return this._data.city;
		};
		this.getState = function () {
			return this._data.state;
		};
		this.getZip = function () {
			return this._data.zip;
		};
		this.getAddress = function () {
			return this._data.address;
		};
		this.getNeighborhood = function () {
			return this._data.neighborhood;
		};
		this.getSubdivision = function () {
			return this._data.subdivision;
		};
		this.getArea = function () {
			return this._data.area;
		};
		this.getPrice = function () {
			return this._data.price;
		};
		this.getBeds = function () {
			return this._data.beds;
		};
		this.getBaths = function () {
			return this._data.baths_total;
		};
		this.getSqFeet = function () {
			return this._data.sq_feet;
		};
		this.getType = function () {
			return this._data.type;
		};
		this.getAcres = function () {
			return this._data.acres;
		};
		this.getLatitude = function () {
			return this._data.lat;
		};
		this.getListingHash = function() {
			return this._data.hash;
		};
		this.getLongitude = function () {
			return this._data.lng;
		};
		this.getDateListed = function () {
			return this._data.date_listed;
		};
		this.getTag = function () {
			return this._data.tag;
		};
		this.getPhotoObj = function() {
			return this.photos;
		};
		this.getPrimaryPhoto = function () {
			return this.photos.getPrimary();
		};
		this.getOtherPhotos = function () {
			return this.photos.getOtherPhotos();
		};
		this.getOtherPhoto = function ( index ) {
			return this.photos.getOtherPhoto( index );
		};
		this.hasPrimaryPhoto = function () {
			if ( '' != this.getPrimaryPhoto() && "undefined" != this.getPrimaryPhoto() && this.getPrimaryPhoto() ) return true;
		};
		this.hasOtherPhotos = function () {
			if ( jQuery.isArray( this.getOtherPhotos() ) && this.getOtherPhotos().length > 0 ) return true;
		};
		this.getOtherPhotoCount = function () {
			if ( jQuery.isArray( this.getOtherPhotos() ) ) return this.getOtherPhotos().length;
		};
		this.getPhotoCount = function () {
			return this._data.photo_count;
		};
		this.getListedBy = function () {
			return this._data.listed_by;
		};
		this.getElementary = function () {
			return this._data.elementary;
		};
		this.getMiddle = function () {
			return this._data.middle;
		};
		this.getHigh = function () {
			return this._data.high;
		};
		this.getExpired = function () {
			return this._data.expired;
		};
		this.getFullAddress = function () {
			return this._data.full_address;
		};
		this.getDOM = function () {
			return this._data.days_on_market;
		};
		this.getListingAgent = function () {
			return this._data.listing_agent;
		};
		this.getAgent = function () {
			if ( this._data.agent ) {
				return new Agent( this._data.agent );
			}
		};
		this.getOffice = function () {
			if ( this._data.office ) return new Office( this._data.office );
		};
		this.getPricePerSqFeet = function () {
			return this._data.price_per_sqft;
		}
		this.getYear = function () {
			return this._data.year;
		};
		this.getRemarks = function () {
			return this._data.remarks;
		};
		this.getSubType = function () {
			return this._data.sub_type;
		};
		this.getStyle = function () {
			return this._data.style;
		};
		this.getMlsArea = function () {
			return this._data.mls_area;
		};
		this.getHoaFee = function () {
			return this._data.hoa_fee;
		};
		this.getHoaFrequency = function () {
			return this._data.hoa_frequency;
		};
		this.getHoaIncludes = function () {
			return this._data.hoa_includes;
		};
		this.getKitchen = function () {
			return this._data.kitchen;
		};
		this.getRange = function () {
			return this._data.range;
		};
		this.getDining = function () {
			return this._data.dining;
		};
		this.getBathDesc = function () {
			return this._data.bath;
		};
		this.getFloors = function () {
			return this._data.floors;
		};
		this.getFireplaces = function () {
			return this._data.fireplaces;
		};
		this.getUtilities = function () {
			return this._data.interior_details;
		};
		this.getSchoolsMap = function () {
			return this._data.schools_map;
		};
		this.getSchoolDistrict = function () {
			return this._data.schools_district;
		};
		this.getParking = function () {
			return this._data.parking_amenities;
		};
		this.getParkingSpaces = function () {
			return this._data.parking_spaces;
		};
		this.getPool = function () {
			return this._data.pool;
		};
		this.getRecreation = function () {
			return this._data.recreation;
		};
		this.getExterior = function () {
			return this._data.exterior;
		};
		this.getLot = function () {
			return this._data.lot;
		};
		this.getRoof = function () {
			return this._data.roof;
		};
		this.getConstruction = function () {
			return this._data.construction;
		};
		this.getFence = function () {
			return this._data.fence;
		};
		this.getPatio = function () {
			return this._data.patio;
		};
		this.getWater = function () {
			return this._data.water;
		};
		this.getGarage = function () {
			return this._data.garage;
		};
		this.getDisclaimer = function () {
			return this._data.disclalimer;
		};
		this.getDisclaimerImg = function () {
			return this._data.disclaimer_img;
		};
		this.getPriceTrendsUrl = function () {
			return this._data.price_trends;
		};
		this.getSalesAndDemandUrl = function () {
			return this._data.sales_and_demand;
		};
		this.getPricePerSqFeetUrl = function () {
			return this._data.price_per_square_foot;
		};
		this.getInventoryUrl = function () {
			return this._data.inventory;
		};
		this.getUrl = function() {
			return this._data.url;
		};
		this.getListingData = function() {

			var detail = {};
			detail.mls_id = this.getMLS();
			detail.mls_feed_id = this.getFeed();
			detail.city = this.getCity();
			detail.state = this.getState();
			detail.zip = this.getZip();
			detail.address = this.getAddress();
			detail.neighborhood = this.getNeighborhood();
			detail.subdivision = this.getSubdivision();
			detail.area = this.getArea();
			detail.price = this.getPrice();
			detail.beds = this.getBeds();
			detail.baths_total = this.getBaths();
			detail.sq_ft = this.getSqFeet();
			detail.type = this.getType();
			detail.acres = this.getAcres();
			detail.lat = this.getLatitude();
			detail.lng = this.getLongitude();
			detail.date_listed = this.getDateListed();
			detail.tag = this.getTag();
			detail.primary_photo = this.getPrimaryPhoto();
			detail.listed_by = this.getListedBy();
			detail.elementary_school = this.getElementary();
			detail.middle_school = this.getMiddle();
			detail.high_school = this.getHigh();
			detail.expired = this.getExpired();

			var listing = {};
			listing.detail = detail;
			//listing.feed_name = this.getFeed();
			return listing;
		}
	};

	// Capture activity bar property tile clicks
	//-------------------------------------------
	$( document ).on( 'click',  '.full-detail:not( .grid-listing ), .featured-listing a:not( .modal-property )',  function( e ) {

		if ( false == OptionsSet ) SetOptions();
		var href = $( this ).prop( 'href' );
		if ( String( href ).indexOf( 'mls' ) > - 1 || $( this ).hasClass( 'listing-panel' ) && true == ModalEnabled ) {
			e.preventDefault();
			if ( String( href ).indexOf( 'mls' ) > - 1 ) {
				$( this ).prop( 'href', '#' ).attr( 'href', '#' );
				$( this ).attr( 'link', href );
				var mls = getMlsFromString( href );
				$( this ).data( 'mls', mls.mls )
					.prop( 'id', mls.id )
					.prop( 'href', '#' )
					.data( 'isSingle', true )
					.addClass( 'listing-panel single-property' );
			}

			runPDM( $( this ), true );
		}
	});

}( jQuery ));

var serialize = function(obj, prefix) {
	var str = [];
	for(var p in obj) {
		var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
		str.push(typeof v == "object" ?
			serialize(v, k) :
		encodeURIComponent(k) + "=" + encodeURIComponent(v));
	}
	return str.join("&");
}

// c = toFixed()
// d = "."
// t = ","
Number.prototype.formatCurrency = function ( c, d, t ) {
	var n = this,
		c = isNaN( c = Math.abs( c ) ) ? 2 : c,
		d = d == undefined ? "." : d,
		t = t == undefined ? "," : t,
		s = n < 0 ? "-" : "",
		i = parseInt( n = Math.abs( +n || 0 ).toFixed( c ) ) + "",
		j = (j = i.length) > 3 ? j % 3 : 0;
	return "$" + s + (j ? i.substr( 0, j ) + t : "") + i.substr( j ).replace( /(\d{3})(?=\d)/g, "$1" + t ) + (c ? d + Math.abs( n - i ).toFixed( c ).slice( 2 ) : "");
};

String.prototype.capitalize = function () {
	return this.replace( /(?:^|\s)\S/g, function ( str ) {
		return str.toUpperCase();
	} );
};


