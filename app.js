var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    flash        = require("connect-flash"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    session = require("express-session"),
    seedDB      = require("./seeds"),
    ejs = require("ejs"),
    methodOverride = require("method-override");
    var SMTPServer = require('smtp-server').SMTPServer;
    var smtpTransport = require('nodemailer-smtp-transport');
    var directTransport = require('nodemailer-direct-transport');
    var nodemailer = require('nodemailer');
mongoose.Promise = global.Promise;

var groupRoutes    = require("./routes/group"),
    dashboardRoutes    = require("./routes/dashboard"),
    adminRoutes    = require("./routes/admin"),
    secretRoutes    = require("./routes/secrets"),
    middleware    = require("./middleware/index"),
    problemRoutes = require("./routes/problems"),
    indexRoutes      = require("./routes/index");
    userRoutes      = require("./routes/user");
    
mongoose.connect("mongodb://localhost/TheMaze");




app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
console.log(__dirname);
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));


// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

var transporter = nodemailer.createTransport('smtps://utacmchapter%40gmail.com:acmGoOo([oO]*])GoOoriii@smtp.gmail.com');
// var mailOptions = {
//     from: '"UT ACM" <ut.acm.chapter@gmail.com>', // sender address
//     to: "ahsprim@gmail.com", // list of receivers
//     subject: 'ACM :: XP Games Register Verification', // Subject line
//     text: '', // plaintext body
//     html: "<html lang='fa'>" +
//         " <body><div  style='text-align: right'> سلام  <br> ثبت نامت با موفقیت انجام شد <br>: برای تایید ایمیلت رو لینک زیر کلیک کن  <br></div> http://<%=host%>/reset/<%=token%></body>"// html body
// };
// transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//         return console.log(error);
//     }
//     console.log('Message sent: ' + info.response);
// });

app.use("/", indexRoutes);
app.use("/admin/", groupRoutes);
// app.use("/dashboard", dashboardRoutes);
app.use("/admin", adminRoutes);
app.use("/", secretRoutes);
app.use("/admin/users", userRoutes);
// app.use("/admin/problems", problemRoutes);

app.use(function(req, res, next) {
    res.status(404).send('Sorry cant find that!');
});

var server = app.listen(3002, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Survey listening at http://%s:%s', host, port);
});
