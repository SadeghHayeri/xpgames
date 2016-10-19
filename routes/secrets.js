var express = require("express");
var router  = express.Router();
var Secret = require("../models/secret");
var middleware = require("../middleware");
var request = require("request");
var multer = require('multer');
var rimraf = require('rimraf');
var fs = require("fs");
var upload = multer({
    dest: './Uploads/',
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
    }
});
var fs = require("fs");

router.get("/secret/:token", function(req, res){
    // Get all secrets from DB
    Secret.findOne({token:token}, function(err, secret) {
        if (err) {
            console.log(err);
        } else {
            res.render("test", {secrets: secret});
        }
    });
});

router.get("/admin/secrets/", function(req, res){
    // Get all secrets from DB
    Secret.find({}, function(err, allSecrets) {
        if (err) {
            console.log(err);
        } else {
            res.render("admin/secrets/index", {secrets: allSecrets});
        }
    });
});
//CREATE - add new secret to DB
router.post("/admin/secrets/",upload.any() ,function(req, res){
    // get data from form and add to secrets array
    var name = req.body.name;
    var token = req.body.token;
    var value = req.body.value;
    var A= req.body.A;
    var C= req.body.C;
    var M= req.body.M;
    // Create a new secret and save to DB
    Secret.create(req.body, function(err, secret){
        console.log(err);
        if(!fs.existsSync("./public/Uploads/Files/"+secret.id))
            fs.mkdirSync("./public/Uploads/Files/"+secret.id);
        if(req.files)
        {
            req.files.forEach(function (file) {
                secret.files.push(file.originalname);
                middleware.uploadToDir(file.path,secret.id,file.originalname);
            });
            secret.save();
        }
        if(err){
            console.log(err);
        } else {

            res.redirect("/admin/secrets");
        }
    });
});

//NEW - show form to create new secret
router.get("/admin/secrets/new", function(req, res){
    res.render("admin/secrets/new");
});

// SHOW - shows more info about one secret
router.get("/admin/secrets/:id", function(req, res){
    //find the secret with provided ID
    Secret.findById(req.params.id).populate("comments").exec(function(err, foundSecret){
        if(err){
            console.log(err);
        } else {
            //render show template with that secret
            res.render("admin/secrets/show", {secret: foundSecret});
        }
    });
});

router.get("/admin/secrets/:id/edit", function(req, res){
    //find the secret with provided ID
    Secret.findById(req.params.id, function(err, foundSecret){
        if(err){
            console.log(err);
        } else {
            //render show template with that secret
            res.render("admin/secrets/edit", {secret: foundSecret});
        }
    });
});

router.put("/admin/secrets/:id", function(req, res){

    Secret.findByIdAndUpdate(req.params.id, {$set: req.body}, function(err, secret){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/admin/secrets/"+secret._id);
        }
    });
});

router.delete("/admin/secrets/:secret_id",function(req, res,next){
    var secret_id = req.params.secret_id;
    Secret.findOne({'_id':req.params.secret_id}).exec(function(err,secret) {
        if(err) return next(err);
        secret.remove();
        req.flash("success"," Successfully deleted!");
        res.redirect("/admin/secrets");
    });
});

module.exports = router;

