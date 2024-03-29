var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var middleware = require("../middleware/index");
var Problem = require("../models/problem");
var Puzzle = require("../models/puzzle");
var Group = require("../models/group");



router.get("/groups", function(req, res){
    Group.find({}).deepPopulate(['members','competition.puzzles','competition.puzzles.problem']).exec(function (err,groups) {
        res.render("admin/groups/index",{groups:groups});
    });
});

router.get("/groups/new", function(req, res){
    res.render("admin/groups/new");
});

router.post("/groups", function(req, res){
    Problem.find({}).exec(function (err,problems) {
        var newGroup = new Group({name:req.body.groupName,competition:{stage:0,puzzles:[]}});
        newGroup.index = Math.floor(Math.random() * 1000);
        Group.create(newGroup,function (err,group) {
            if(err)
                console.log(err);
            problems.forEach(function (problem) {
                Puzzle.create({problem:problem,group:group,status:"unsolved",tags:problem.tags},
                    function (err,puzzle) {
                    group.competition.puzzles.push(puzzle);
                    group.save();
                });
            });
            res.redirect('groups/'+group._id);
        });
    });
});

router.post("/groups/:groupId/addUser", function(req, res){
    Group.findById(req.params.groupId,function (err,group) {
        User.findById(req.body.userid).exec(function (err,user) {
            if(user) {
                group.addMember(user);
            } else {
                req.flash('error','User Not Found');
            }
        });
        res.redirect('/admin/groups/'+group._id);
    });
});

router.post("/groups/:groupId/addScore", function(req, res){
    Group.findById(req.params.groupId,function (err,group) {
        var n = Number(req.body.score);
        group.competition.score += n;
        group.save();
        res.redirect('/admin/groups/'+group._id);
    });
});

router.get("/groups/:groupId", function(req, res){
    Group.findById(req.params.groupId).deepPopulate(['members','competition.puzzles','competition.puzzles.problem'])
        .exec(function (err,group) {
            User.find({_id:{$nin:group.members}}).exec(function (err,users) {
                res.render("admin/groups/show",{group:group,users:users});
            });
        });
});

router.get("/groups/:groupId/puzzles/:puzzle_id", function(req, res){
    Puzzle.findById(req.params.puzzle_id).exec(function (err,puzzle) {
        res.render("admin/puzzle/show",{puzzle:puzzle});
    });
});

router.get("/groups/:groupId/hint/:problem_id", function(req, res){
    Group.findById(req.params.groupId).populate(['members','competition.puzzles']).exec(function (err,group) {
        Puzzle.findById(req.params.problem_id).populate("problem").exec(function (err,puzzle) {
            puzzle.status = "reviewd";
            puzzle.save();
            res.redirect("/admin/groups/");
        });
    });
});

router.delete("/groups/:groupId", function(req, res){
    Group.findById(req.params.groupId).exec(function (err,group) {
        group.remove();
        res.redirect('/admin/groups');
    });
});

module.exports = router;