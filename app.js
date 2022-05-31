var express = require('express');
var path = require('path');
// var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');

var indexRouter = require('./routes');
var middleware = require('./middleware/api_auth');

var app = express();

app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', middleware.apiAuth, indexRouter);

mongoose.connect('mongodb+srv://mongodb:VY5jAiyr9aSf2XPJ@cluster0.8m3glek.mongodb.net/?retryWrites=true&w=majority')
.then(() => {
    console.log("MongoDB connected");
})
.catch(err => {
    console.log("MongoDB fail to connect", err);
});

module.exports = app;
