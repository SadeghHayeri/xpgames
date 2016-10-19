var mongoose = require("mongoose");

var SecretSchema = new mongoose.Schema({
    name:String,
    token:String,
    value:String,
    A:String,
    C:String,
    M:String
});

SecretSchema.virtual('feedback').get(function (){
    return this.problem.getFeedback(this.group.index);
});

SecretSchema.methods.requsetForHint = function () {
    if(this.group.competition.hints < 1)
        return false;
    this.group.competition.hints--;
    this.hintSubmit = Date.now();
    this.status = "requestedForHint";
    this.save();
    return true;
};

module.exports = mongoose.model("Secret", SecretSchema);

