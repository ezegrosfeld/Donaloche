const mongoose = require('mongoose')
const Proyecto = new mongoose.Schema({
  name : {type:String, trim:true},
  description : {type:String, trim:true},
  uname: {type:String, trim:true},
  udni : {type:Number, min:8, trim:true},
  email: {type:String, trim:true},
  phone : {type:Number, min:6, trim:true},
  aim: {type:Number, trim:true},
  money: {type:Number, trim:true, default:0},
  video : {type:String, trim:true},
  photo: {type:String, trim:true},
  validation: {type:Boolean, default: false, trim:true},
})

module.exports = mongoose.model('Proyecto', Proyecto);
