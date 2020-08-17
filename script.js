const express = require('express');
const chalk = require('chalk');
const debug = require('debug')('app:app');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({secret: 'recipe'}));
require('./src/config/passport.js')(app);
app.use(express.static(path.join(__dirname, 'static')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.set('views', './src/html/');
app.set('view engine', 'ejs');

const nav = [{link: "/", title: "Home"}, {link: "/allPosts", title: "All Posts"}, {link: "/auth/signin", title: "Login"}, {link: "/auth/signUp", title: "Sign Up"}]

const homeRouter = require("./src/routes/homeRouter")(nav);
const allRouter = require("./src/routes/allRouter")(nav);
const adminRouter = require("./src/routes/adminRouter")();
const recipeRouter = require("./src/routes/recipeRouter")(nav);
const authRouter = require("./src/routes/authRouter")(nav);

app.use('/', homeRouter);
app.use('/allPosts', allRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);
app.use('/recipe', recipeRouter);

app.listen(port, () => {
  debug(`listening on port ${chalk.green(port)}`);
});

var filename;
$("#files").change(function() {
  filename = this.files[0].name
  debug(filename);
});

