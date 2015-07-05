var mongoose 	= require('mongoose');
var timestamps 	= require('mongoose-timestamp');
var Schema		= mongoose.Schema;
var config		= require('./../config');
var bcrypt		= require('bcrypt');

var UserSchema = new Schema({
	username: String,
	email: { type: String, required: true, unique: true}, 
	password: String,
	fname: String,
	lname: String, 
	contacts: [String],
	image: String,
	happy_addr: {type: String, unique: true}
});

UserSchema.methods.validatePassword = function(password) {

	var pw = config.salt + password + this.email;

	return bcrypt.compareSync(pw, this.password);
}

UserSchema.methods.setPassword = function(password) {
	var pw = config.salt + password + this.email; 
	salt = bcrypt.genSaltSync(10);
	this.password = bcrypt.hashSync(pw, salt); 
}

UserSchema.methods.getPassword = function(password) {
	var pw = config.salt + password + this.email; 
	salt = bcrypt.genSaltSync(10);
	return bcrypt.hashSync(pw, salt); 
}

UserSchema.methods.getContacts = function() {
	var self = this; 

	mongoose.models["User"].find({});
}

UserSchema.pre("save", function(next, done) {
   var self = this;

    mongoose.models["User"].findOne({email : this.email}, 'email', function(err, results) {
       if(this.isNew) {
	        if(err) {
	            next(err);
	        } else if(results) {
	            self.invalidate("email", "email must be unique");
	            var error = new Error('Email already in use'); 
	            error.type = 'emailInUse';
	            next(error);
	        } else {
	            next();
	        }
    	}
    	else {
    		next();
    	}
    });
});
UserSchema.plugin(timestamps); 

module.exports = mongoose.model('User', UserSchema);
