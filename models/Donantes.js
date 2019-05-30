const mongoose = require('mongoose')
const Donantes = new mongoose.Schema({
  nombre: {type:String, trim:true},
  dni: {type:Number, trim:true},
  telefono: {type:Number, trim:true},
  email: {type:String, trim:true},
},{ timestamps: true })

module.exports = mongoose.model('Donantes', Donantes);
