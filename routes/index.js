var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/contacto', (req,res,next) => {
  res.render('contacto')
})

module.exports = router;
