// routes.js
var User 		= require('./models/user');
var Forgot 		= require('./models/forgot');
var uuid			= require('node-uuid');

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
			happy_addr: uuid()
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
					console.log("saving user error: ", err);
					res.status(500).send("Random error");				
				}
			}

		});
	});

	router.post('/forgot', function(req, res) {
		console.log("forgot...");
		var email = req.body.forgot; 
		var url = uuid();
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

		var usr = User.findOne({email: req.user.email}, function(err, user) {
			if(err) {
				console.log(">> ERROR: \t Unable to fetch user"); 
				res.status(500).send("Error"); 
			}
			if(!user) {
				console.log(">> ERROR: \t Can not find user");
				res.status(500).send("Error");
			}
			else {
				user.getContacts(function(err, results) {
					if(err) {
						console.log(">> ERROR: \t Unable to fetch user's contacts"); 
						res.status(500).send("Error"); 
					}

					res.json( {
						fname: req.user.fname, 
						lname: req.user.lname, 
						email: req.user.email, 
						contacts: results, 
						username: req.user.username, 
						notifications: req.user.notifications, 
						happy_addr: req.user.happy_addr
					});

				});
			}

		});


		// res.json( {fname: req.user.fname, lname: req.user.lname, email: req.user.email, contacts: req.user.contacts, username: req.user.username, happy_addr: req.user.happy_addr});
	}); 

	router.post('/updateuser', function(req, res) {
		var data = {
			 fname: req.body.fname, 
			 lname: req.body.lname, 
			 email: req.body.email, 
			 password: req.body.password
		}; 

		console.log("data: ", data, req.user._id);
		User.findOne({_id: req.user._id}, function( err, user) {
			if(err) {
				console.log(err); 
				res.status(500).send('err');
			}
			else if(!user) {
				res.status(500).send('user not found'); 
			}
			else {
				user.fname = data.fname; 
				user.lname = data.lname; 
				user.email = data.email; 
				if(data.password) {
					user.setPassword(data.password); 
				}

				user.save(function(err) {
					if(err) {
						console.log('err');
						res.status(500).send('email in use'); 
					}
					else {
						res.send("ok");
					}
				});


			}
		})
	});
};

