var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
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

 // router.all("/admin/*",middleware.isLoggedIn,middleware.havePermission);
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});

router.post('/register',function(req, res,next) {
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret="+ '6LdPnQgUAAAAAFdvxzaLnLu9_CsJEXTAmHg2YeG8' +"&response=" +req.body['g-recaptcha-response'];
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
    request(verificationUrl,function(error,response,body) {
        body = JSON.parse(body);
        if(true)
        {
            passport.authenticate('local', function(err, user, info) {
                if (err) return next(err);
                if (!user) {
                    return res.redirect('/login')
                }
                req.logIn(user, function(err) {
                    if (err) return next(err);

                    return res.redirect('/home');
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
                                subject: 'ACM :: Register Verification', // Subject line
                                text: 'سلام. لطفا روی لینک زیر کلیک کن تا گذر واژه ات رو عوض کنی :)', // plaintext body
                                html: ejs.render('http://<%=host%>/reset/<%=token%>',{host:req.headers.host,token:token}) // html body
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
router.get("/home",middleware.isLoggedIn,middleware.verified, function(req, res){
    res.redirect("/");
});
// router.get("/home",middleware.isLoggedIn,middleware.verified, function(req, res){
//
//     User.findById(req.user.id).populate("group").exec(function (err,user) {
//         if(!user.group) {
//             res.render("home", {user:user,puzzles: null, metaPuzzle: null, canGoToNextStage: null});
//         }else {
//             user.group.findCurrentStagePuzzles(function (err, puzzles) {
//                 user.group.findCurrentStageMetaPuzzle(function (err, metaPuzzle) {
//                     var canGoToNextStage = false;
//                     if (metaPuzzle)
//                         canGoToNextStage = metaPuzzle.solved;
//                     if (err) {
//                         console.log(err);
//                     } else {
//                         res.render("home",
//                             {
//                                 user:user,
//                                 puzzles: puzzles,
//                                 metaPuzzle: metaPuzzle,
//                                 canGoToNextStage: canGoToNextStage
//                             }
//                         );
//                     }
//                 });
//             });
//         }
//     });
// });

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
