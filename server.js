var express = require( 'express' )
var session = require( 'express-session' )
var cookieParser = require( 'cookie-parser' )
var url = require( 'url' );
var etsyjs = require( 'etsy-js-heroku' ); //https://github.com/GeorgiCodes/etsy-js
var socketio = require( 'socket.io' );


/*
var client = etsyjs.client( {
	key: 'w6ramnbxy2q8vbg73f4cvraq',
	secret: 'bgijd4jori',
	callbackURL: 'http://localhost:5000/authorise'
} );
*/

var client = etsyjs.client( {
	key: '31g6lvujf5sqq2x6pc37uy98',
	secret: 'm8c8aqbjtf',
	callbackURL: 'http://localhost:5000/authorise'
} );
//lunalovebird@hotmail.com
//zhaoying2015

client.etsyOAuth._requestUrl += '%20' + 'listings_r' + '%20' + 'cart_rw';

var shopId = 'BirdArtWorld'; //JoeTestShop

var secret = 'secEtsy';

var app = express();
app.use( cookieParser( secret ) );
app.use( session( {
	secret: secret,
	resave: true,
	saveUninitialized: true
} ) );


app.get( '/', function( req, res ) {

	//if we are accessing the API for the first time, then kick off OAuth dance
	if ( !req.session.user ) {

		client.requestToken( function( err, response ) {
			if ( err ) {
				console.log( err );
				return;
			}

			console.log( response );

			req.session.token = response.token;
			req.session.sec = response.tokenSecret;
			res.redirect( response.loginUrl );
		} );

	}
	//else if we have OAuth credentials for this session then use them
	else {

		res.send( "Session started." );
	}
} );


app.get( '/authorise', function( req, res ) {

	//parse the query string for OAuth verifier
	var query = url.parse( req.url, true ).query;
	var verifier = query.oauth_verifier;

	//final part of OAuth dance, request access token and secret with given verifier
	client.accessToken( req.session.token, req.session.sec, verifier, function( err, response ) {
		//update our session with OAuth token and secret
		req.session.token = response.token;
		req.session.sec = response.tokenSecret;
		res.redirect( '/me' );
	} );
} );


app.get( '/me', function( req, res ) {

	//we now have OAuth credentials for this session and can perform authenticated requests
	client.auth( req.session.token, req.session.sec ).me().find( function( err, body, headers ) {
		if ( err ) {
			console.log( err );
			return;
		}

		if ( body ) {

			req.session.user = body.results[ 0 ][ 'user_id' ];

			res.send( body.results[ 0 ] );
		}
	} );
} );


app.get( '/listings_draft', function( req, res ) {

	var _client = client.auth( req.session.token, req.session.sec );

	_client.get( '/shops/' + shopId + '/listings/draft', {}, function( err, status, body, headers ) {
		if ( err ) {
			console.log( err );
			return;
		}

		if ( body ) {
			res.send( body.results );
		}
	} );
} );


app.get( '/listings', function( req, res ) {

	var _client = client.auth( req.session.token, req.session.sec );

	_client.get( '/shops/' + shopId + '/listings/active', {}, function( err, status, body, headers ) {
		if ( err ) {
			console.log( err );
			return;
		}

		if ( body ) {
			res.send( body.results );
		}
	} );
} );


app.get( '/listing_images/:listing_id', function( req, res ) {

	var listing_id = req.params.listing_id;

	client.auth( req.session.token, req.session.sec ).get( '/listings/' + listing_id + '/images', {}, function( err, status, body, headers ) {
		if ( err ) {
			console.log( err );
			return;
		}

		if ( body ) {

			res.send( body.results );
		}
	} );
} );


var server = app.listen( process.env.PORT || 5000, function() {
	console.log( 'Listening on port: ', server.address().port );
} );

var io = socketio.listen( server );

io.sockets.on( 'connection', function( socket ) {
	console.log( 'A user has connected' );
} );