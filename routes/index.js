var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Group = require("../models/group");
var Secret = require("../models/secret");
var sanitize = require('mongo-sanitize');
var nodemailer = require('nodemailer');
var request = require('request');
var middleware = require('../middleware/index');
var crypto = require("crypto");
var async = require("async");
var SMTPServer = require('smtp-server').SMTPServer;
var simplesmtp = require("simplesmtp");
var fs = require("fs");
var ejs = require("ejs");
var smtpTransport = require('nodemailer-smtp-transport');
var directTransport = require('nodemailer-direct-transport');
// create reusable transporter object using the default SMTP transport
// setup e-mail data with unicode symbols
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
    res.render("register");
});
router.post('/register',function(req, res,next) {
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret="+ '6Le-aTQUAAAAABDNSUxz72B-qDaX7HnzJi6u06Qk' +"&response=" +req.body['g-recaptcha-response'];
    request(verificationUrl,function(error,response,body) {
        body = JSON.parse(body);
        var username = sanitize(req.body.email);
        var password = sanitize(req.body.password);
        var firstname = sanitize(req.body.firstname);
        var lastname = sanitize(req.body.lastname);
        var studentId = sanitize(req.body.studentId);
        var studyField = sanitize(req.body.studyField);
        var email = sanitize(req.body.email);
        if(studyField)
            studyField = "Computer";
        else
            studyField = "Electric";
        if(body.success&&(!(firstname.length==0||lastname.length==0||email.length==0))){
            var user = new User({
                firstname: firstname,
                lastname: lastname,
                username: username,
                studentId: studentId,
                studyField: studyField,
                email: email,
                password: password,
            });
            User.findOne({username: user.username}).exec(function (err, existUser) {
                if (err) return next(err);
                if (existUser) {
                    console.log('Username already exist');
                    req.flash('error', 'Username already exist');
                    res.redirect('/register');
                } else {
                    user.save(function (err) {
                        req.logIn(user, function (err) {
                            res.redirect('/home');
                        });
                    });
                }
            });
        } else {
            res.redirect('/register')
        }
    });
});
//show login form
router.get("/login", function(req, res){
    res.render("login");
});
router.post('/login', function(req, res, next) {
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret="+ '6LdPnQgUAAAAAFdvxzaLnLu9_CsJEXTAmHg2YeG8' +"&response=" +req.body['g-recaptcha-response'];
    request(verificationUrl,function(error,response,body) {
        body = JSON.parse(body);
        if(true)
        {
            passport.authenticate('local', function(err, user, info) {
                console.log(req.session.redirectTo);
                if (err) return next(err);
                if (!user) {
                    return res.redirect('/login')
                }
                req.logIn(user, function(err) {
                    if (err) return next(err);
                    var redirectTo = req.session.redirectTo;
                    req.session.redirectTo = null;
                    return res.redirect(redirectTo?redirectTo:'/home');
                });
            })(req, res, next);
        }else{
            res.redirect('/login');
        }
    });
});

// logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "LOGGED YOU OUT!");
    res.redirect("/");
});
router.get('/forgot', function(req, res,next) {
    res.render('forgot_password', {user: req.user});
});
router.post('/forgot', function(req, res, next) {
    var usr;
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret="+ '6LdPnQgUAAAAAFdvxzaLnLu9_CsJEXTAmHg2YeG8' +"&response=" +req.body['g-recaptcha-response'];
    request(verificationUrl,function(error,response,body) {
        if (true) {
            async.waterfall([
                function (done) {
                    crypto.randomBytes(24, function (err, buf) {
                        var token = buf.toString('hex');
                        done(err, token);
                    });
                },
                function (token, done) {
                    User.findOne({username: req.body.email}, function (err, user) {
                        if (err) return next(err);
                        if (!user) {
                            console.log('No account with that email address exists.');
                            req.flash('error', 'No account with that email address exists.');
                            return res.redirect('/forgot');
                        }
                        usr = user;
                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                        user.save(function (err) {
                            var transporter = nodemailer.createTransport('smtps://utacmchapter%40gmail.com:acmGoOo([oO]*])GoOoriii@smtp.gmail.com');
                            var mailOptions = {
                                from: '"UT ACM" <ut.acm.chapter@gmail.com>', // sender address
                                to: req.body.email, // list of receivers
                                subject: 'ACM :: XP Games Reset Password', // Subject line
                                text: 'سلام. لطفا روی لینک زیر کلیک کن تا گذر واژه ات رو عوض کنی :)', // plaintext body
                                html: ejs.render("<html lang='fa'>" +
                                    " <body><div  style='text-align: right'> سلام  <br>: لطفا روی لینک زیر کلیک کن تا گذر واژه ات رو عوض کنی <br></div> http://<%=host%>/reset/<%=token%></body>" ,{host:req.headers.host,token:token})// html body
                            };
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    return console.log(error);
                                }
                                console.log('Message sent: ' + info.response);
                            });
                            console.log('http://' + req.headers.host + '/reset/' + token);
                            done(err, token, user);
                        });
                    });
                },
            ], function (err) {
                if (err) return next(err);
                res.redirect('/');
            });
        }else{
            res.redirect('/forgot');
        }
    });
});
router.get('/reset/:token', function(req, res,next) {
    User.findOne({ resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        }
        , function(err, user) {
            if(err) return next(err);
            if (!user) {
                // req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            } else{
                res.render('reset_password', {user:user});
            }
        });
});
// router.get("/home",middleware.isLoggedIn,middleware.verified, function(req, res){
//     res.redirect("/");
// });
router.get("/home",middleware.isLoggedIn,middleware.verified, function(req, res){

    User.findById(req.user.id).populate("group").exec(function (err,user) {
        console.log(user);
        res.render("home",{user:user});
    });
});
router.get("/scoreboard", function(req, res){
    Group.find().sort("-competition.score").exec(function (err,groups) {
       res.render("scoreboard",{groups:groups});
    });
});
router.get("/timer",middleware.isLoggedIn, function(req, res){
    res.render("test");
});
router.get("/cast", function(req, res){
    res.render("cast");
});
router.post('/reset/:token', function(req, res,next) {
    async.waterfall([
        function(done) {
            User.findOne({$and:[{resetPasswordToken: req.params.token},{resetPasswordExpires: { $gt: Date.now() }} ]},
                function(err, user) {
                    if (!user) {
                        req.flash('Password reset token is invalid or has expired.');
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }

                    user.password = req.body.password;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function(err) {
                        req.logIn(user, function(err) {
                            req.flash('Success! Your password has been changed.');
                            req.flash('success', 'Success! Your password has been changed.');
                            done(err, user);
                        });
                    });
                });
        },
    ], function(err) {
        res.redirect('/login');
    });
});
router.get('/verify/:token', function(req, res,next) {
    User.findOne({ verifyToken: req.params.token}, function(err, user) {
        if(err) return next(err);
        if (!user) {
            return res.redirect('/');
        } else{
            user.verified = true;
            user.verifyToken = null;
            user.save();
            res.redirect("/home");
        }
    });
});
module.exports = router;
