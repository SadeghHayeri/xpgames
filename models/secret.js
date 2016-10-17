var mongoose = require("mongoose");

var SecretSchema = new mongoose.Schema({
    token:String,
    value:Number,
    expire:Date
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

