var express = require('express');
var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
var logger = require('./helper/logger')
var mongoose = require('mongoose');
var cors = require('cors');
var { v4: uuidv4 } = require('uuid');
var indexRouter = require('./routes');
var middleware = require('./middleware/api_auth');
var startBot = require('./telegram')
var app = express();

app.use(cors());

app.use(function(req, res, next) {
    req.id = uuidv4();
    next();
})

app.use(express.json());
app.use(logger.request)
app.use(logger.response)
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', middleware.apiAuth, indexRouter);
// let mongoURI = process.env.MONGO_URI
// mongoose.connect(mongoURI)
// .then(() => {
//     console.log("MongoDB connected");
// })
// .catch(err => {
//     console.log("MongoDB fail to connect", err);
// });

// startBot();

// mongoose.connection.on("disconnected", () => {
//     console.log("Disconnected gracefully");
// })

process.on('exit', (code) => {
    // mongoose.disconnect();
    console.log(`Exit on code: ${code}`)
    process.exit(0)
})

process.on('SIGINT', () => {
    // mongoose.disconnect();
    console.log(`Exit by SIGINT`)
    process.exit(0)
})

module.exports = app;
