const express = require('express');
const {MongoClient, ObjectID, GridFSBucket} = require('mongodb');
const debug = require('debug')('app:authRouter');
const authRouter = express.Router();
const passport = require('passport');
const fs = require('fs');
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

                const user = {username, password, admin: false, likedPosts: []};

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

                    const user = {username, password, admin: true, likedPosts: []};

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
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        let error=""; 
        if(req.session.error != null) {
            error = req.session.error;
            req.session.error = null;
        }
        (async function getPic(){
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');  

                const db = client.db(dbName);

                const col = db.collection('profPics.files');    
                const colChunks = db.collection('profPics.chunks');
                
                debug(req.user.username);
                const docs = await col.findOne({filename: `${req.user.username}`})
                debug(docs);
                if(docs){
                    const chunks = await colChunks.findOne({files_id : ObjectID(docs._id)});
                    debug(chunks);
                    if(chunks){
                        let fileData = [];          
                        fileData.push(chunks.data.toString('base64'));          
                        let finalFile = 'data:' + docs.contentType + ';base64,' + fileData.join('');          
                        
                        res.render('profile', {nav, user: req.user, passSucc: "", error, imgurl: finalFile});
                        return;
                    };      
                }

                res.render('profile', {nav, user: req.user, passSucc: "", error, imgurl: "/images/profile.png"});
            }catch(err) {
                debug(err.stack);
            };  
            client.close();
        }());
    })
    .post((req, res) => {
        res.redirect('/auth/profile/edit');
    });
    authRouter.route('/profile/edit')
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
        const birthdayDOM = `${req.user.birthday.substring(6)}-${req.user.birthday.substring(0, 2)}-${req.user.birthday.substring(3, 5)}`;
        res.render('profileEdit', {nav, user: req.user, bdayString: birthdayDOM, error:""});
    })
    .post((req, res) => {
        const {username, name, birthday} = req.body;
        const oldUsername = req.user.username;
        const birthYear = birthday.substring(0,4);
        const birthMonth = birthday.substring(5,7);
        const birthDay = birthday.substring(8);
        var birthdayBetter = `${birthMonth}/${birthDay}/${birthYear}`;
        if(birthdayBetter == "//") {
            birthdayBetter = "";
        }
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        (async function addUser(){
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');
                const db = client.db(dbName);
                const col = db.collection('users');     

                const usernames = await col.find().toArray();
                debug(usernames);
        
                let userFound = false;
        
                for(let i = 0; i < usernames.length; i++) {
                    if(usernames[i].username.toLowerCase() == username.toLowerCase()) {
                        userFound = true;
                        break;
                    }
                }
                
                if(!userFound || username == req.user.username) {
                    const results = await col.updateOne({username: req.user.username}, {$set: {username, name, birthday: birthdayBetter}});
                    debug(results);        
                    const user = await col.findOne({username});
                    req.login(user, () => {
                        (async function updateRecipes(){
                            const moreResults = await db.collection('recipes').updateMany({creator: oldUsername}, {$set : {creator: req.user.username}});
                        }());
                        res.redirect('/auth/profile');
                    });
                }
                else {
                    const birthdayDOM = `${req.user.birthday.substring(6)}-${req.user.birthday.substring(0, 2)}-${req.user.birthday.substring(3, 5)}`;
                    res.render('profileEdit', {nav, user: req.user, bdayString: birthdayDOM, error: "This username is taken, please enter a different one."});
                }
            } catch (err) {
                debug(err.stack);
            }
            client.close();
        }());
    });
    authRouter.route('/profile/changePass')
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
        res.render('profileEditPass', {nav, user: req.user, error: ""});
    })
    .post((req, res) => {
        const {pass, passConf} = req.body;
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        if(pass == passConf) {
            (async function addUser(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');
                    const db = client.db(dbName);
                    const col = db.collection('users');

                    if(pass.length > 0) {
                        const results = await col.updateOne({username: req.user.username}, {$set: {password: pass}});
                        debug(results);        
                        const user = await col.findOne({username: req.user.username});
                        req.login(user, () => {
                            res.render('profile', {nav, user: req.user, passSucc: "Password Changed Successfully", error:""});
                        });
                    }
                    else {
                        res.render("profileEditPass", {nav, user: req.user, error: "You must enter a password."});
                    }
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        }
        else {
            res.render('profileEditPass', {nav, user: req.user, error: "Passwords do not match"});
        }
    });
    authRouter.route('/logout')
    .get((req,res) => {
        req.logout();
        nav[4] = {link: "/auth/signin", title: "Login"};
        nav[5] = {link: "/auth/signUp", title: "Sign Up"};
        res.redirect('/');
    }); 
    authRouter.route('/profile/deleteConf')
    .all((req, res, next) => {
        if(!req.user) {
            res.redirect("/");
        }
        else {
            next();
        }
    })
    .get((req, res) => {
        res.render("deleteConf", {nav, user: req.user});
    })
    .post((req, res) => {
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        (async function delProf(){
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');
                const db = client.db(dbName);
                const col = db.collection('users');

                const results = await col.deleteOne({username: req.user.username});
                debug(results);
            } catch (err) {
                debug(err.stack);
            }
            client.close();
        }());
        res.redirect('/auth/logout');
    });

    authRouter.route('/profile/uploadPic')
    .all((req, res, next) => {
        if(!req.user) {
            res.redirect("/");
        }
        else {
            next();
        }
    })
    .get((req, res) => {
        res.redirect('/');
    })
    .post((req, res) => {
        const upload = require("../../static/js/upload")(req, res);

        (async function uploadFile(){
            try {
                await upload;
            
                console.log(req.file);
                if (req.file == undefined) {
                    req.session.error="You must select a file";
                    res.redirect('/auth/profile');
                    debug('no file');
                    return;
                }
            
                res.redirect('/auth/profile');
                debug('good');
                return;
          } catch (error) {
            console.log(error);
            req.session.error=`Error when trying upload image: ${error}`;
            res.redirect('/auth/profile');
            debug('bad');
            return;
          }
        }());
    });
    return authRouter;
}

module.exports = router;