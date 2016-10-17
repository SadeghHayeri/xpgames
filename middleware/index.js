
var fs = require('fs');
var nodemailer = require('nodemailer');
var ejs = require("ejs");
function makeSecret(lenght)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < lenght; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
module.exports = {
    isLoggedIn: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error", "You must be signed in to do that!");
        res.redirect("/login");
    },
    havePermission: function(req, res, next){
        if(req.user.isAdmin){
            return next();
        }
        req.flash("error", "you have not permission!");
        res.redirect("/");
    },
    verified:function (req,res,next) {
        if(req.user.verified)
            return next();
        else
        {
            req.flash('loginMessage', 'No user found.');
            if(!req.user.verifyToken)
            {
                var verifyToken = makeSecret(24);
                var transporter = nodemailer.createTransport('smtps://utacmchapter%40gmail.com:acmGoOo([oO]*])GoOoriii@smtp.gmail.com');
                var mailOptions = {
                    from: '"UT ACM" <ut.acm.chapter@gmail.com>', // sender address
                    to: req.user.email, // list of receivers
                    subject: 'ACM :: Register Verification', // Subject line
                    text: 'سلام. لطفا روی لینک زیر کلیک کن تا ایمیلت رو تایید کنی :)', // plaintext body
                    html: ejs.render('http://<%=host%>/verify/<%=token%>',{host:req.headers.host,token:verifyToken}) // html body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        return console.log(error);
                    }
                    req.user.verifyToken = verifyToken;
                    req.user.save();
                    console.log('Message sent: ' + info.response);
                });
            }
            else
            {
                console.log("please verify");
            }
            res.redirect("/");
        }
    },
    makeSecret :makeSecret,
    hashAnswer: function(answer,hashIndex)
    {
        var text = "";
        var possible = "CMuUfNXYko7fIzHLOwQQWOcoifsBFkSlS4L6sEDxRIVMt9aptrnHEtIuK8drVnGOJUpiZeBTJCvX42m29WTg4PJForglANgiVD72";

        for( var i=0; i < lenght; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },

    uploadToDir:function (tmp_path,folder_name,file_name) {
        var target_path = './public/Uploads/Files/' + folder_name + '/' + file_name;
        fs.rename(tmp_path, target_path, function (err) {
            if (err) throw err;
            fs.unlink(tmp_path, function () {
                if (err) throw err;
            });
        });
    }
}