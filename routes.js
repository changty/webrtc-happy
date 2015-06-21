// routes.js
var User 		= require('./models/user');
var Forgot 		= require('./models/forgot');

// Simple route middleware to ensure user is authenticated.
// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) { return next(); }
//   req.session.error = 'Please login!';
//   res.redirect('/');
// }


// param router = express.Router instance
module.exports = function(router, passport) {

	router.get('/failure', function(req, res) {
		res.send('Login failed!');
	});

	router.post('/login', passport.authenticate('local', 
			{
				successRedirect: '/',
				failureRedirect: '/',
				failureFlash: true
			}), 
			
			function(req, res) {
				console.log("login");
			}
	);

	router.get('/logout', function(req,res) {
		req.logout();
		res.redirect('/');
	});


	router.get('/test', passport.ensureAuthenticated, function(req, res) {
		res.send('you are logged in!');
	});


	router.post('/newuser', function(req, res) {
		var e = new User({
			email: req.body.email,
			username: '',
			fname: 	req.body.fname,
			lname: req.body.lname,
			happy_addr: ''
		});
		e.setPassword(req.body.password);

		e.save(function(err) {
			if(!err) {
				res.send('user saved!');
			}
			else {
				// user already exists
				if(err.type && err.type == 'emailInUse') {
					res.status(500).send({emailInUse: true});
				}
				// something else
				else {
					res.status(500).send("Random error");				
				}
			}

		});
	});

	router.post('/forgot', function(req, res) {
		console.log("forgot...");
		var email = req.body.forgot; 
		var url = guid();
		console.log(email, url);

		var forgot = new Forgot({
			email: email,
			url: url,
			ttl: Date.now()
		});

		forgot.save(function(err) {
			if(err) {
				if(err.type && err.type == 'userNotFound') {
					res.status(500).send({userNotFound: true}); 
				}
				else {
					res.status(500).send('something went wrong');
				}
			}
			else {
				res.send('email.sent');
			}
		})

	});

	router.get('/forgot/:id', function(req,res) {
		console.log(req.params.id);
		Forgot.findOne({url: req.params.id}, function(err, url) {
			if(err) {
				console.log(err); 
				res.redirect('/');
			}
			else if(!url) {
				res.redirect('/');
			}
			else {
				res.sendFile(__dirname + '/public/' + 'forgot.html');
			}
		});

	});

	router.post('/reset', function(req,res) {
		var password = req.body.password; 
		var uuid = req.body.uuid;
		console.log(password, uuid);
		Forgot.findOne({url: uuid }, function(err, url) {
			if(err) {
				console.log(err); 
				res.status(500).send('something went wrong');
			}
			else if(!url) {
				console.log("no url found");
				res.status(500).send('something went wrong');
			}
			else {
				User.findOne({email: url.email}, function(err, user) {
					if(err || !user) {
						console.log(err); 
						res.status(500).send('something went wrong');
					}
					else {
						user.setPassword(password); 
						user.save(function(err) {
							if(err) {
								console.log("error saving pw");
								res.status(500).send('something went wrong');
							}
							else {
								console.log("success");
								res.send('ok');
							}
						});				
					}
				});

			}
		});

	});


	router.get('/flash', function(req, res){
	  // Set a flash message by passing the key, followed by the value, to req.flash(). 
	  req.flash('info', 'Flash is back!')
	  res.redirect('/');
	});


	router.get('/user', function(req, res) {
		res.json( {fname: req.user.fname, lname: req.user.lname, email: req.user.email, contacts: req.user.contacts, username: req.user.username, happy_addr: req.user.happy_addr});
	})

	function guid() {
		  function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}
};

