var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var session = require("express-session");
var bodyParser = require("body-parser");

var app = express();

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'cats',
  saveUninitialized: true,
  cookie: { secure: true }
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
var db = require('./models/index');

//シリアライズ、デシリアライズ
//データを保存して、通信の際にユーザーのデータを送れるようにする
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 複合して認証
passport.deserializeUser((id, done) => {
  db.user.findByPk(id).then((results) => {
    console.log(results);
    done(results);
  }, (error) => {
    done(error);
  });
});

//認証部分
passport.use(new LocalStrategy({
  usernameField: 'userName',
  passwordField: 'password'
},
  (userName, password, done) => {
    const options = {
      where: {
        name: userName,
        password: password
      }
    }
    db.user.findOne(options).then((results) => {
      if (!results) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (results.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, results);
    }, (error) => {
      return done(error);
    });
  }));

var methodOverride = require('method-override');
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}));

//ルーターの設置
const displayRouter = require('./routes/display');
const messagesRouter = require('./routes/messages');
const repliesRouter = require('./routes/replies');
const usersRouter = require('./routes/users');
const sessionsRouter = require('./routes/sessions');

//ルーターの使用
app.use('/',displayRouter);
app.use('/messages',messagesRouter);
app.use('/replies',repliesRouter);
app.use('/users',usersRouter);
app.use('/',sessionsRouter);

//ここから書き始める

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
