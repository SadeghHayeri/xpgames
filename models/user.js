var crypto = require('crypto');
var bcrypt = require('bcrypt');
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var validateLocalStrategyProperty = function(property) {
    return ((this.provider !== 'local' && !this.updated) || property.length);
};
var UserSchema = new mongoose.Schema({
    firstname: {
        type: String,
        trim: true,
        default: '',
        validate: [validateLocalStrategyProperty, 'Please fill in your first name']
    },
    lastname:{
        type: String,
        trim: true,
        default: '',
        validate: [validateLocalStrategyProperty, 'Please fill in your first name']
    },
    studentId:{
        type: String,
        trim: true,
        default: '',
        validate: [validateLocalStrategyProperty, 'Please fill in your first name']
    },
    email:{
        type: String,
        trim: true,
        default: '',
        validate: [validateLocalStrategyProperty, 'Please fill in your first name']
    },
    color:String,
    username: String,
    password: String,
    groupname:String,
    verified:{type:Boolean,default:false},
    verifyToken:String,
    isAdmin:Boolean,
    experience:{type:Number,default:0},
    group:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    resetPasswordToken:String,
    resetPasswordExpires:Date,
});

UserSchema.pre('save', function(next) {
    var user = this;
    var SALT_FACTOR = 5;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) return next(err);
        var hash = bcrypt.hashSync(user.password, salt, null);
        user.password = hash;
        console.log(user.password);
        return next();
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.virtual("name").get(function () {
    return this.firstname + " " + this.lastname;
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);