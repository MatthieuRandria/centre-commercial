const express = require("express");
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const app = express();


app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); // ✅ POUR FORMULAIRES
app.use(express.json()); // Middleware pour lire le JSON

// Session
app.use(session({
    name:'sid',
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie:{
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    }
}));

// flash
app.use(flash());

// Routers

module.exports = app;