var express = require("express");
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

var app = express();

app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 301));

app.use(express.static('public'));

app.listen(3000);