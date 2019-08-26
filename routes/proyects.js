  var express = require('express');
const dotenv = require('dotenv')
var router = express.Router();
var mercadopago = require('mercadopago')
var oldAccessToken = mercadopago.configurations.getAccessToken();
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const Proyects = require('../models/Proyecto')
var nodeMailer = require('nodemailer');



dotenv.config();

aws.config.update({
    // Your SECRET ACCESS KEY from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.SECRET_ACCESS_KEY
    secretAccessKey: process.env.AWS_SECRET,
    // Not working key, Your ACCESS KEY ID from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.ACCESS_KEY_ID
    accessKeyId:process.env.AWS_ID ,
    region: 'sa-east-1' // region of your bucket
});

const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'donaloche',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
})


var proj = {id: ""}
/* GET home page. */
router.get('/', (req,res) => {
  const query = req.query;
  if(query.category){
    var title = query.category
  } else{
    var title = 'Proyectos'
  }
  Proyects.find(query).sort({updatedAt: 'desc'})
  .then(data =>{
    res.render('proyects', {proyects:data, title:title})
  })
  .catch(err => {
    res.json({
      confirmation: "Fail",
      error: err.message
    })
  })
})

router.get('/guide', (req, res) => {
  res.render('guia', {title: 'Guía'})
})

router.get('/new', (req, res) => {
  res.render('new',{title: 'Nuevo Proyecto'})
})

router.post('/addproyect', (req, res) => {
  var data = req.body;
  var model = new Proyects(data);
  model.save();
  const id = model.id;
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
      from:'donaloche@gmail.com',
      to: model.email,
      subject: 'Proyecto en Donaloche',
      text: 'Su proyecto ha sido subido con exito, pronto nos comunicaremos con usted para continuar con el proceso. Muchas gracias.'
  };
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
  });
  let transporter1 = nodeMailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
          // should be replaced with real sender's account
          user: process.env.EMAIL,
          pass: process.env.PASS
      }
  });
  let mailOptions1 = {
      // should be replaced with real recipient's account
      from:'donaloche@gmail.com',
      to: 'donaloche@gmail.com',
      subject: 'Nuevo proyecto',
      text: 'Se ha subido un nuevo proyecto a la página, https://donaloche.herokuapp.com/proyects/' + model.id + ' Su email: ' + model.email + ' Su telefono ' + model.phone + ' Su nombre: ' + model.uname
  };
  transporter1.sendMail(mailOptions1, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
  });
  res.render('files',{id:id, title:'Nuevo Proyecto'})
})

router.post('/confirm', (req, res) => {
  const data = req.body;
  res.render('pay', {data: data, title:'Donar'});
});

router.post('/add', (req, res) => {
  const token = req.body.token;
  const payment_method_id = req.body.payment_method_id;
  const installments = req.body.installments;
  const am = req.body.am;
  const issuer_id = req.body.issuer_id;
  const email = req.body.email

  var payment = {
    transaction_amount: am,
    token: token,
    description: 'Donacion en Donaloche',
    installments: installments,
    payment_method_id: payment_method_id,
    issuer_id: issuer_id,
    payer: {
      email: email
    }
  };
  var p = parseInt(payment.transaction_amount)
  payment.transaction_amount = p

  var i = parseInt(payment.installments)
  payment.installments = i

  mercadopago.configurations.setAccessToken(process.env.ACCESS_TOKEN);

  const id = req.body.id

  mercadopago.payment.save(payment).then(function (data) {
    Proyects.findByIdAndUpdate(id, {$inc:{money: +payment.transaction_amount, donations: +1}}, {new:true})
    .then(data =>{
      if(data.money >= data.aim){
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
            from:data.email,
            to: 'donaloche@gmail.com',
            subject: 'Proyecto Completo',
            text: 'El siguiente proyecto ha conseguido su objetivo: https://donaloche.herokuapp.com/proyects/' + data.id
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
      };
      res.render('success1', {data:data})
    })
    .catch(err =>{
      res.json({message:"Algo fallo, Nuestros desarrolladores han sido notificados. Intentelo de nuevo más tarde"})
    })
  }).catch(function (error) {
    res.render('checkout', {
      error: error
    });
  }).finally(function() {
    mercadopago.configurations.setAccessToken(oldAccessToken);
  });
});

router.get('/:id', (req, res) => {
  const id = req.params.id

  Proyects.findById(id)
  .then(data => {
    var percent = parseInt((data.money * 100) / data.aim);
    res.render('show', {proyect: data, percent:percent, title:data.name, description:data.description})
  })
  .catch(err => {
    res.json({
      confirmation: 'error',
      message : err.message
    })
  })

});

router.post('/upload', upload.array('upl',1), (req, res, next) => {
  const id = req.body.id;
  Proyects.findByIdAndUpdate(id, {photo:req.files[0].location}, {new:true})
  .then(data =>{
    res.render('success')
  })
  .catch(err =>{
    res.json({message:"Algo fallo, Nuestros desarrolladores han sido notificados. Intentelo de nuevo más tarde"})
  })
});

router.post('/approve', (req,res) => {
  const id = req.body.id;
  const aim = parseInt(req.body.aim);
  const total = parseInt(aim+(aim*0.045))
  Proyects.findByIdAndUpdate(id, {validation: true, aim:total}, {new:true})
  .then(data =>{
    res.json({data: data})
  })
  .catch(err =>{
    res.json({message:err})
  })
});


module.exports = router;
