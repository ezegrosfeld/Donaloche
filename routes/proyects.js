var express = require('express');
const dotenv = require('dotenv')
var router = express.Router();
var mercadopago = require('mercadopago')
var oldAccessToken = mercadopago.configurations.getAccessToken();
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const Proyects = require('../models/Proyecto')

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
  Proyects.find(query)
  .then(data =>{
    res.render('proyects', {proyects:data})
  })
  .catch(err => {
    res.json({
      confirmation: "Fail",
      error: err.message
    })
  })
})

router.get('/new', (req, res) => {
  res.render('new')
})

router.post('/addproyect', (req, res) => {
  var data = req.body;
  var model = new Proyects(data);
  model.save();
  const id = model.id;
  res.render('files',{id:id})
})

router.post('/confirm', (req, res) => {
  const data = req.body;
  res.render('pay', {data: data});
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

  mercadopago.configurations.setAccessToken('TEST-4867163097281958-052115-ef5efe862e89f2208bd689918fdc0a27-362516243');

  const id = req.body.id

  mercadopago.payment.save(payment).then(function (data) {
    Proyects.findByIdAndUpdate(id, {$inc:{money: +payment.transaction_amount}}, {new:true})
    .then(data =>{
      res.json({data:data})
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
    res.render('show', {proyect: data})
  })
  .catch(err => {
    res.json({
      confirmation: 'error',
      message : err.message
    })
  })

});

router.post('/upload', upload.array('upl',2), (req, res, next) => {
  const id = req.body.id;
  Proyects.findByIdAndUpdate(id, {video:req.files[0].location, photo:req.files[1].location}, {new:true})
  .then(data =>{
    res.json({data:data})
  })
  .catch(err =>{
    res.json({message:"Algo fallo, Nuestros desarrolladores han sido notificados. Intentelo de nuevo más tarde"})
  })
});


module.exports = router;
