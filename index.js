/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(__dirname + '/public')); // set location of static files

// Generate and write secret key into .env file
const fs = require('fs');
const generator = require('generate-password');

const secretKey = generator.generate({
    length: 8,
    numbers: true,
    uppercase: true
})

const envContent = `# Author Secret Key\nSECRET_KEY=${secretKey}\n`;
fs.writeFileSync('.env', envContent);

// Set up environment variable
const dotenv = require('dotenv');
dotenv.config();
console.log(`Current Admin Secret Code: ${process.env.SECRET_KEY}`);

// Set up session
const session = require('express-session');

app.use(session({
    secret: 'bloggingsecret',
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
}));

// Set up connect-flash
const flash = require('connect-flash');
app.use(flash());

// To make flash message available in template
app.use(function (req, res, next) {
    res.locals.message = req.flash();
    next();
});

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db', function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

// Handle requests to the home page 
app.get('/', (req, res) => {
    res.render("main.ejs");
});

// Add all the route handlers in usersRoutes and readerRoutes to the app under the path /users
const usersRoutes = require('./routes/author');
app.use('/author', usersRoutes);

const readerRoutes = require('./routes/reader');
app.use('/reader', readerRoutes);

// Shorten the path of bootstrap module as a static path
app.use("/css",express.static("./node_modules/bootstrap/dist/css"));
app.use("/js",express.static("./node_modules/bootstrap/dist/js"));


// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})