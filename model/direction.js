const mongoose = require("monoogse");


const directionschema = mongoose.schema({
    startLoaction : {
        type : Object,
        required : true
    },
    currentLocation :{
        type :Object,
   required :true
    },
    EndLocation :{
        type :Object ,
        required : true
    }
})

const directionmodels=  mongoose.model("direction", directionschema);

module.exports = directionmodels; 