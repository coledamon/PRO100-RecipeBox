const express = require('express');
const chalk = require('chalk');
const debug = require('debug')('app');
const morgan = require('morgan');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.set('views', './html/');
app.set('view engine', 'ejs');

const homeRouter = require("./routes/homeRouter");
const allRouter = require("./routes/allRouter");
const loginRouter = require("./routes/loginRouter");
const signRouter = require("./routes/signRouter");

app.use('/', homeRouter);
app.use('/allPosts', allRouter);
app.use('/login', loginRouter);
app.use('/signup', signRouter);

app.listen(port, () => {
  debug(`listening on port ${chalk.green(port)}`);
});
