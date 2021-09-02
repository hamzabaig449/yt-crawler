let QUERY = "Making an omlette";
let MINIMUM_SUBSCRIBERS = "0";
let MAXIMUM_SUBSCRIBERS = "1000000";
let MINIMUM_VIEWS = "0";
let MAXIMUM_VIEWS = "1000000";
let EXPORT_FILE_NAME = "Youtube_Data.xlsx";

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const fileUpload = require('express-fileupload');

const port = process.env.PORT || 3000;

var app = express();
var authRouter = require('./routes/auth');
app.use(fileUpload({
  createParentPath:true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'hfasjddJHJDHF JSHJdh SA42136487@&#(()@!',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxage: 1000*3600*24
  }
}))


app.use('/', authRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // next(createError(404));
  res.status(404);
  res.render('404')
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err.message)
  // render the error page
  res.status(err.status || 500);
  res.render('500');
});
app.listen(port,()=>{
  console.log(`server is listening on port ${port}`);
})

module.exports = app;