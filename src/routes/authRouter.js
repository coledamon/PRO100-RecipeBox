const express = require('express');
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:authRouter');
const authRouter = express.Router();
const passport = require('passport');
let whereToRead = 0;

function router(nav) {
    authRouter.use((req, res, next) => {
        if(!req.user) {
            nav[2].title = "";
            nav[3].title = "";
        }
        else {
            nav[2] = {link: "/personalPosts", title: "Personal Posts"};
            nav[3] = {link: "/recipe/create", title:"Create"};
        }
        next();
    });
    authRouter.route('/signUp')
    .get((req, res) => {
        res.render('signUp', {nav, error:""});
    })
    .post((req, res) => {
        const {username, password} = req.body;
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';

        (async function addUser(){
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');

                const db = client.db(dbName);
                const col = db.collection('users');

                const user = {username, password, admin: false};

                const usernames = await col.find().toArray();
                debug(usernames);

                let userFound = false;

                for(let i = 0; i < usernames.length; i++) {
                    debug(usernames[i].username);
                    debug(username);
                    if(usernames[i].username.toLowerCase() == username.toLowerCase()) {
                        userFound = true;
                        break;
                    }
                }
                
                if(!userFound && password.length > 0) {
                    const results = await col.insertOne(user);
                    debug(results);        
                    req.login(results.ops[0], () => {
                        res.redirect('/auth/profile');
                    });
                }
                else if(password.length > 0) {
                    res.render("signUp", {nav, error: "This username is taken, please enter a different one."});
                }
                else {
                    res.render("signUp", {nav, error: "You must enter a password."});
                }
            } catch (err) {
                debug(err.stack);
            }
            client.close();
        }());        
    });
    authRouter.route('/signUp/admin')
    .all((req, res, next) => {
        if(req.user) {
            res.redirect("/auth/profile");
        }
        else {
            next();
        }
    })
    .get((req, res) => {
        res.render('signUpAdmin', {nav, error:""});
    })
    .post((req, res) => {
        const {username, password, adminPass} = req.body;
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        if(adminPass === "password") {
            (async function addUser(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');

                    const db = client.db(dbName);
                    const col = db.collection('users');

                    const user = {username, password, admin: true};

                    const usernames = await col.find().toArray();
                    debug(usernames);

                    let userFound = false;

                    for(let i = 0; i < usernames.length; i++) {
                        debug(usernames[i].username);
                        debug(username);
                        if(usernames[i].username.toLowerCase() == username.toLowerCase()) {
                            userFound = true;
                            break;
                        }
                    }

                    if(!userFound && password.length > 0) {
                        const results = await col.insertOne(user);
                        debug(results);        
                        req.login(results.ops[0], () => {
                            res.redirect('/auth/profile');
                        });
                    }
                    else if(password.length > 0) {
                        res.render("signUpAdmin", {nav, error: "This username is taken, please enter a different one."});
                    }
                    else {
                        res.render("signUpAdmin", {nav, error: "You must enter a password."});
                    }
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());  
        }   
        else {
            res.render("signUpAdmin", {nav, error: "Incorrect Admin Access Code."});
        }   
    });
    authRouter.route('/signin')
    .get((req, res) => {
        res.render('login', {nav, whereToRead, errors : req.session.messages || [] });
        try {
            if(req.session.messages[whereToRead] === void(0)) {
                throw "I hate this";
            }
            whereToRead++;
        }catch(err) {}
    })
    .post(passport.authenticate('local', {
        successRedirect: '/auth/profile',
        failureRedirect: '/auth/signin',
        failureMessage: 'Invalid username or password'
    }));
    authRouter.route('/profile')
    .all((req, res, next) => {
        if(req.user) {
            nav[4] = {link: "/auth/profile", title: "Profile"};
            nav[5] = {link: "/auth/logout", title: "Log Out"};
            next();
        } else {
            res.redirect('/');
        }
    })
    .get((req, res) => {
        res.render('profile', {nav});
    });
    authRouter.route('/logout')
    .get((req,res) => {
        req.logout();
        nav[4] = {link: "/auth/signin", title: "Login"};
        nav[5] = {link: "/auth/signUp", title: "Sign Up"};
        res.redirect('/');
    }); 
    return authRouter;
}

module.exports = router;