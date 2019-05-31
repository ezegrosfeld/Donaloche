var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
var nodeMailer = require('nodemailer');
const Donantes = require('../models/Donantes')

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/contacto', (req,res,next) => {
  res.render('contacto', {title: 'Contacto'})
})

router.get('/donar', (req, res) => {
  var query = req.query;
  Donantes.find(query).sort({updatedAt: 'desc'})
  .then(data => {
    res.render('donar', {title:'Donar a Donaloche', data:data})
  })
  .catch(err => {
    res.json({
      confirmation: 'error',
      message : err.message
    })
  })
})
router.get('/registro', (req, res) => {
  res.render('registro', {title:'Registrar'})
})

router.get('/story',(req, res) => {
  res.render('story', {title:"Nosotros"})
})

router.post('/adddonator', (req, res) => {
  var data = req.body;
  var model = new Donantes(data);
  model.save();
  res.redirect('/donar')
})

router.post('/email', (req,res) => {
  let transporter = nodeMailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
          // should be replaced with real sender's account
          user: process.env.EMAIL,
          pass: process.env.PASS
      }
  });
  let mailOptions = {
      // should be replaced with real recipient's account
      from:req.body.email,
      to: process.env.EMAIL,
      subject: req.body.subject,
      text: req.body.message + ' ' + req.body.email
  };
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
  });
  res.render('email')
})

module.exports = router;
