var express = require('express');
var path = require('path');
var assert = require('assert');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
var hbs = require('express-handlebars')
const mongoose = require('mongoose')
var MongoClient = require('mongodb').MongoClient;
var mercadopago = require('mercadopago');
var indexRouter = require('./routes/index');
var indexProyects = require('./routes/proyects');


var app = express();

dotenv.config();

mercadopago.configure({
    access_token: process.env.ACCESS_TOKEN
});

app.engine('hbs', hbs({extname: '.hbs'}));
app.set('view engine', 'hbs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/proyects', indexProyects);


mongoose.connect(process.env.DB_URL, {useNewUrlParser: true}, function(err, db) {
  if (err) {
    throw err;
  }
  assert.equal(null, err);
  console.log("Connected successfully to server");
});

module.exports = app;
