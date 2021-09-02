var express = require('express');
var router = express.Router();

const Auth = require('../controllers/auth')



router.get('/', Auth.root);

router.post('/signInProcess', Auth.signInProcess);
module.exports = router;
