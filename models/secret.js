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

SecretSchema.methods.verify= function (A,C,M) {
    A = A.toUpperCase();
    C = C.toUpperCase();
    M = M.toUpperCase();
    if(A==this.A&&C==this.C&&M==this.M)
        return true;
    else
        return false;
};

module.exports = mongoose.model("Secret", SecretSchema);

