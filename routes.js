// routes.js
var User 		= require('./models/user');

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please login!';
  res.redirect('/');
}


// param router = express.Router instance
module.exports = function(router, passport) {

	router.get('/', function(req, res) {
		res.send('Hello world!');
	});

	router.post('/login', passport.authenticate('local', 
			{
				successRedirect: '/api/success',
				failureRedirect: '/',
				failureFlash: true
			}));

	router.get('/logout', function(req,res) {
		req.logout();
		res.redirect('/');
	});

	router.get('/login', function(req,res) {
		res.send('u failed');
	});

	router.get('/test', ensureAuthenticated, function(req, res) {
		res.send('you are logged in!');
	});

	router.get('/success', ensureAuthenticated, function(req,res) {
		res.send('Logged in!');
	});

	router.get('/addDemoUser', function(req, res) {
		var e = new User({
			email: 'einari.kurvinen@gmail.com',
			username: 'chgt',
			fname: 'Einari',
			lname: 'Kurvinen',
			happy_addr: 'einari'
		});
		e.setPassword('einari');

		e.save(function(err) {
			if(!err) {
				res.send('user saved!');
			}
			else {
				console.log(err);
				res.send('Something went wrong');				
			}

		});
	});


	router.get('/flash', function(req, res){
	  // Set a flash message by passing the key, followed by the value, to req.flash(). 
	  req.flash('info', 'Flash is back!')
	  res.redirect('/');
	});
};

