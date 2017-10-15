var fs = require('fs');
var nodemailer = require('nodemailer');
var ejs = require("ejs");

function makeSecret(lenght) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < lenght; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
module.exports = {
    isLoggedIn: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.session.redirectTo = req.url;
        req.session.reqBody = req.body;
        // console.log(req.body);
        // console.log(req.method);
        req.flash("error", "You must be signed in to do that!");
        res.redirect("/login");
    },
    havePermission: function(req, res, next) {
        if (req.user.isAdmin || req.user.email == "ahsprim@gmail.com") {
            return next();
        }
        req.flash("error", "you have not permission!");
        res.redirect("/");
    },
    verified: function(req, res, next) {
        if (req.user.verified)
            return next();
        else {
            req.flash('loginMessage', 'No user found.');
            if (!req.user.verifyToken) {
                var verifyToken = makeSecret(24);
                var transporter = nodemailer.createTransport({
                    service: 'Yahoo',
                    auth: {
                        user: "utacm.chapter@yahoo.com",
                        pass: "acmGoOo([oO]*])GoOoriii"
                    }
                });
                var mailOptions = {
                    from: '"UT ACM" <utacm.chapter@yahoo.com>', // sender address
                    to: req.user.email, // list of receivers
                    subject: 'ACM :: Register Verification', // Subject line
                    text: ' ', // plaintext body
                    html: ejs.render("<html lang='fa'>" +
                            " <body><div  style='text-align: right'> سلام  <br>: ثبت نامت با موفقیت انجام شد  <br>: برای تایید ایمیلت رو لینک زیر کلیک کن  <br></div> http://<%=host%>/verify/<%=token%></body>", {
                                host: req.headers.host,
                                token: verifyToken
                            }) // html body
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        return console.log(error);
                    }
                    req.user.verifyToken = verifyToken;
                    req.user.save();
                    console.log('Message sent: ' + info.response);
                });


            } else {
                console.log("please verify");
            }
            res.redirect("/");
        }
    },
    makeSecret: makeSecret,
    hashAnswer: function(answer, hashIndex) {
        var text = "";
        var possible = "CMuUfNXYko7fIzHLOwQQWOcoifsBFkSlS4L6sEDxRIVMt9aptrnHEtIuK8drVnGOJUpiZeBTJCvX42m29WTg4PJForglANgiVD72";

        for (var i = 0; i < lenght; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },

    uploadToDir: function(tmp_path, folder_name, file_name) {
        var target_path = './public/Uploads/Files/' + folder_name + '/' + file_name;
        fs.rename(tmp_path, target_path, function(err) {
            if (err) throw err;
            fs.unlink(tmp_path, function() {
                if (err) throw err;
            });
        });
    }
}