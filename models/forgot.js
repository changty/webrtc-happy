var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;
var config		= require('./../config');
var bcrypt		= require('bcrypt');

var ForgotSchema = new Schema({
	email: String,
	url: String, 
	ttl: {type: Date, default: Date.now, expires: 900} // this url will self destruct in 15 mins
});




ForgotSchema.pre("save", function(next, done) {
   var self = this;

    mongoose.models["User"].findOne({email : this.email}, function(err, results) {
        if(err) {
        	console.log(err);
            next(err);
        } else if(results) {
        	console.log(results);
            next();
        } else {
 			var error = new Error('user not found'); 
            error.type = 'userNotFound';
            next(error);         
        }
    });
});

module.exports = mongoose.model('Forgot', ForgotSchema);
