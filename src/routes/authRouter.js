const express = require('express');
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:authRouter');
const authRouter = express.Router();
const passport = require('passport');

function router(nav) {
    authRouter.route('/signUp')
    .get((req, res) => {
        res.render('signUp', {nav});
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
                const col = await db.collection('users');

                const user = {username, password};

                const results = await col.insertOne(user);
                debug(results);        
                req.login(results.ops[0], () => {
                    res.redirect('/auth/profile');
                });        
            } catch (err) {
                debug(err.stack);
            }
            client.close();
        }());        
    });
    authRouter.route('/signin')
    .get((req, res) => {
        res.render('login', {nav})
    })
    .post(passport.authenticate('local', {
        successRedirect: '/auth/profile',
        failureRedirect: '/auth/signin'
    }));
    authRouter.route('/profile')
    .all((req, res, next) => {
        if(req.user) {
            nav[2] = {link: "/auth/profile", title: "Profile"};
            nav[3] = {link: "/auth/logout", title: "Log Out"};
            next();
        } else {
            res.redirect('/');
        }
    })
    .get((req, res) => {
        res.json(req.user);
    });
    authRouter.route('/logout')
    .get((req,res) => {
        req.logout();
        nav[2] = {link: "/auth/signin", title: "Login"};
        nav[3] = {link: "/auth/signUp", title: "Sign Up"};
        res.redirect('/');
    }); 
    return authRouter;
}

module.exports = router;