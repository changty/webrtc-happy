// Server.js

var express			= require('express');
var app				= express();
var http			= require('http').Server(app);

var bodyParser		= require('body-parser');
var cookieParser	= require('cookie-parser');
var port 			= process.env.PORT || 3333;

// Socket.io server
var io				= require('socket.io')(http);

// Dependencies for authentication
var redis			= require('redis').createClient();
var passport		= require('passport'); 
var session			= require('express-session');
var RedisStore		= require('connect-redis')(session);
var socketioRedis	= require('passport-socketio-redis');
var flash			= require('express-flash');

// passport startegies
var LocalStrategy	= require('passport-local').Strategy;

var config 			= require('./config');

var router 			= express.Router(); 
var staticFiles		= express.Router();

var mongoose		= require('mongoose'); 
mongoose.connect(config.mongoURL);
var User 			= require('./models/user');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// configure express session
app.use(session({
	secret: config.secret,
	resave: true,
	saveUninitialized: true,
	key: 'connect.sid',
	store: new RedisStore({
			host: config.redisHost,
			port: config.redisPort,
			client: redis
		})
	})
);
app.use(passport.initialize()); 
app.use(passport.session());
app.use(flash());


// add passport strategies
passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log("finding user: ", username, password);
		User.findOne({ email: username}, function(err, user) {
			if (err) { return done(err); }

			if (!user) {
				return done(null, false, { message: 'Incorrect username'});
			}
			if (!user.validatePassword(password)) {
				return done(null, false, { message: 'Incorrect password'});
			}

			return done(null, user);
		});
	}

));

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

// Initialize socket.io and share express session
io.use(socketioRedis.authorize({
	passport: passport,
	cookieParser: cookieParser,
	key: 'connect.sid',
	secret: config.secret,
	store: new RedisStore({host: config.redisHost, port: config.redisPort, client: redis}),
	success: authorizeSuccess, // success callback
	fail: authorizeFail // fail callback 
}));

// io session authorized success
function authorizeSuccess(data, accept) {
	console.log('>> IO: \t', 'Authorized success'); 
	accept();
}

function authorizeFail(data, message, error, accept) {
	if(error) {
		accept(new Error(message)); 
	}

	console.log('>> IO: \t', 'Authorization failed');
}


// Start socket server 
io.on('connection', function(socket) {
	console.log('>> IO: \t ---- User connected');
});

router.use(function(req, res, next) {
	// do something on each call
	// log action?
	console.log(">> api request: \t", req.method, req.url);
	next();
});

staticFiles.use(function(req, res, next) {
	console.log(">> file request: \t", req.method, req.url);
	next();
});

// load all the routes
require('./routes')(router, passport);
// enable serving static files from public folder
staticFiles.use(express.static(__dirname + '/public'));

app.use('/api', router); 
app.use('/', staticFiles); 

// run express
app.listen(port);
console.log(">>>>>>>> Server running @ ", port);