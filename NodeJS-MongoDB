//  Pull cities, distinct states, and distinct counties

var config = require( "../xsg-config" );
var mongoose = require( 'mongoose' );
var mConnect = require( config.LIB_DIR + "/MongoConnect" );
module.exports = {
	getStates       : function ( callback ) {
		mConnect.MongoConnect( function () {
			var City = mongoose.model( "Cities", CitySchema.Cities );
			var CitySchema = require( config.SCHEMA_DIR + "/Cities" );

			City.aggregate(
				{ $group: { _id: "$state" } },
				{
					$project: {
						state: "$_id",
						count: 1,
						_id  : 0
					}
				},
				{ $sort: { "state": 1 } }
			)
				.exec( function ( err, states ) {
					callback( states );
				} );
		} );
	},
	getCitiesByState: function ( state, callback ) {
		mConnect.MongoConnect( function () {
			var CitySchema = require( config.SCHEMA_DIR + "/Cities" );
			var City = mongoose.model( "Cities", CitySchema.Cities );
			City.aggregate(
				{ $match: { "state": state } },
				{ $group: { _id: "$city" } },
				{
					$project: {
						city : "$_id",
						count: 1,
						_id  : 0
					}
				},
				{ $sort: { "city": 1 } }
			)
				.exec( function ( err, cities ) {
					callback( cities );
				} );
		} );
	},
	getStateLong    : function ( callback ) {
		mConnect.MongoConnect( function () {
			var CountySchema = require( config.SCHEMA_DIR + "/Counties" );
			var County = mongoose.model( "Counties", CountySchema.Counties );
			County.aggregate(
				{
					$group: {
						_id  : "$full_state",
						state: { $first: "$state" }
					}
				},
				{
					$project: {
						full_state: "$_id",
						state     : 1,
						count     : 1,
						_id       : 0
					}
				},
				{ $sort: { "full_state": 1 } }
			).exec( function ( err, state_full ) {
					if ( err ) throw err;
					callback( state_full );
				} );
		} );
	}
};
