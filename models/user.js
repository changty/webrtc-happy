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
	happy_addr: {type: String, unique: true}
});

UserSchema.methods.validatePassword = function(password) {

	var pw = config.salt + password + this.email;
	// bcrypt.compare(pw, this.password, function(err, res) {
	// 	if(err) {
	// 		console.log(">> BCRYPT: error comparing passwords");
	// 	}
	// 	return res;
	// });

	return bcrypt.compareSync(pw, this.password);
}

UserSchema.methods.setPassword = function(password) {
	var pw = config.salt + password + this.email; 
	salt = bcrypt.genSaltSync(10);
	this.password = bcrypt.hashSync(pw, salt); 
}

UserSchema.pre("save", function(next, done) {
   var self = this;

    mongoose.models["User"].findOne({email : this.email}, 'email', function(err, results) {
        if(err) {
            next(err);
        } else if(results) {
            self.invalidate("email", "email must be unique");
            next(new Error("email must be unique"));
        } else {
            next();
        }
    });
});
UserSchema.plugin(timestamps); 

module.exports = mongoose.model('User', UserSchema);

// j2löjASDF309asfj1"#12312akjf09JKjl3iieinarieinari.kurvinen@gmail.com
// $2a$10$.J51/WnCLHrPgwBZ8VtLKOLE0usTl4AEgFXqxvtjrdwhe/LbgXjCW

// j2löjASDF309asfj1"#12312akjf09JKjl3iieinarieinari.kurvinen@gmail.com
// $2a$10$.J51/WnCLHrPgwBZ8VtLKOLE0usTl4AEgFXqxvtjrdwhe/LbgXjCW

// $2a$10$DbSb4WddZBXiReMFTh5kl.yS3xUgRS.7vczN/x98uhukPYoEBSAK.