const express = require('express');
const {MongoClient, ObjectID} = require('mongodb');
const debug = require('debug')('app:recipeRouter');
const recipeRouter = express.Router();

function router(nav) {
    recipeRouter.use((req, res, next) => {
        if(!req.user) {
            nav[2].title = "";
            nav[3].title = "";
            nav[4].title = "";
        }
        else {
            nav[2] = {link: "/personalPosts", title: "Personal Posts"};
            if(req.user.admin) {
                nav[3] = {link: "/flaggedRecipes", title: "Flagged Rcipes"};
            }
            else {
                nav[3].title = "";
            }
            nav[4] = {link: "/recipe/create", title:"Create"};
        }
        next();
    });
    
    recipeRouter.route("/create")
    .all((req, res, next) => {
        if(!req.user) {
            res.redirect("/");
        }
        else {
            next();
        }
    })
    .get((req, res) => {
        res.render("recipeCreate", {nav, error:""});
    })
    .post((req, res) => {
        const {name, prep_time, cook_time, description, ingredients, directions, visibility} = req.body;
        let public = true;
        if(visibility == "private") {
            public = false;
        }
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        if(name.length > 0 && prep_time.length > 0 && cook_time.length > 0 && description.length > 0 && ingredients.length > 0 && directions.length > 0) {
            (async function addRecipe(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');
                    const db = client.db(dbName);
                    const col = db.collection('recipes');
                    const recipe = {name, prep_time, cook_time, description, ingredients, directions, creator: req.user.username, public, likes: 0, flagged: false, creationDate: new Date(Date.now())};
                    const names = await col.find().toArray();
                    let nameFound = false;

                    for(let i = 0; i < names.length; i++) {
                        if(names[i].name.toLowerCase() == name.toLowerCase()) {
                            nameFound = true;
                            break;
                        }
                    }
                    if(!nameFound) {
                        const results = await col.insertOne(recipe);
                        res.redirect("/recipe/" + results.ops[0]._id);
                    }
                    else {
                        res.render("recipeCreate", {nav, error: "A recipe with this name already exists, please choose a different one."});
                    }
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        }
        else {
            res.render("recipeCreate", {nav, error:"All fields must contain text."});
        }
    });
    recipeRouter.route('/like/:id')
        .post((req, res) => {
            const {location} = req.body;
            const id = req.params.id;
            debug(id);
            const user = req.user;
            const url = 'mongodb://localhost:27017';
            const dbName = 'Paughers';

            (async function likePost(){
                let client;
                const like = 1;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');
                    if(user){
                        const db = client.db(dbName);
                        const userList = db.collection('users');
                        const username = await userList.findOne({_id: ObjectID(req.user._id)});
                        const col = db.collection('recipes');
                        const recipe = await col.findOne({_id: ObjectID(id)});
                        debug(recipe);
                        debug(username);
                        debug(username.likedPosts);
                        debug(recipe._id);
                        debug(username.likedPosts.includes(`${recipe._id}`));
                        if(!username.likedPosts.includes(`${recipe._id}`)) {
                            const addLike = recipe.likes + like;
                            const results = await col.updateOne({ _id: ObjectID(id) }, {$set: {likes : addLike}});
                            const oldLikeList = username.likedPosts;
                            debug(oldLikeList);
                            oldLikeList.push(`${recipe._id}`);
                            const addRecipeToList = await userList.updateOne({ _id: ObjectID(username._id)}, {$set: {likedPosts: oldLikeList}});
                            debug(addRecipeToList);
                        }
                        else{
                            const minusLike = recipe.likes - like;
                            const results = await col.updateOne({ _id: ObjectID(id) }, {$set: {likes : minusLike}});
                            debug(results); 
                            const oldLikeList = username.likedPosts;
                            oldLikeList.splice(username.likedPosts.indexOf(`${recipe._id}`), 1);

                             debug(oldLikeList);
                            const addRecipeToList = await userList.updateOne({ _id: ObjectID(username._id)}, {$set: {likedPosts: oldLikeList}});
                            debug(addRecipeToList);
                        }
                        req.login(username, () => {
                            if(location == "home"){
                                res.redirect('/')
                            }
                            else if (location == "recipe") {
                                res.redirect(`/recipe/${id}`)
                            }
                        });
                    }
                    else if(!user){
                        req.session.error = "You need to create an account before liking any posts."
                        res.redirect("/auth/signUp"); 
                    }
                    
                    
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        });
    recipeRouter.route("/edit/:id")
    .all((req, res, next) => {
        if(!req.user) {
            res.redirect("/");
        }
        else {
            next();
        }
    })
    .get((req, res) => {
        const id = req.params.id;
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        (async function mongo(){
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');
                const db = client.db(dbName);
                const col = db.collection('recipes');
                debug(col);
                
                const recipe = await col.findOne({ _id: ObjectID(id) });
                
                res.render('recipeEdit', {nav, recipe, user: req.user, error: ""});
            } catch (err) {
                debug(err.stack);
            }
            client.close();
        }());
    })
    .post((req, res) => {
        const {prep_time, cook_time, description, ingredients, directions, visibility, _id} = req.body;
        let public = true;
        if(visibility == "private") {
            public = false;
        }
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';
        if(prep_time.length > 0 && cook_time.length > 0 && description.length > 0 && ingredients.length > 0 && directions.length > 0) {
            (async function updateRecipe(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');
                    const db = client.db(dbName);
                    const col = db.collection('recipes');

                    const results = await col.updateOne({ _id: ObjectID(_id) }, {$set: {prep_time, cook_time, description, ingredients, directions, public}});
                    debug(results);       
                    res.redirect(`/recipe/${_id}`);
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        }
        else {
            (async function mongo(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');
                    const db = client.db(dbName);
                    const col = db.collection('recipes');
                    debug(col);
                    
                    const recipe = await col.findOne({ _id: ObjectID(_id) });
                    
                    res.render('recipeEdit', {nav, recipe, user: req.user, error: "All fields must contain text."});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        }
    });
    recipeRouter.route('/:id')
        .get((req, res) => {
            const id = req.params.id;
            const url = 'mongodb://localhost:27017';
            const dbName = 'Paughers';

            (async function mongo(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');

                    const db = client.db(dbName);
                    const col = db.collection('recipes');
                    debug(col);
                    
                    const recipe = await col.findOne({ _id: ObjectID(id) });
                    
                    res.render('recipe', {nav, recipe, user: req.user});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        })
        .post((req, res) => {
            const url = 'mongodb://localhost:27017';
            const dbName = 'Paughers';

            const {type} = req.body;
            if(type =="delete") {
                (async function delRecipe(){
                    let client;
                    try {
                        client = await MongoClient.connect(url);
                        debug('Connected correctly to server');

                        const db = client.db(dbName);
                        const col = db.collection('recipes');

                        const recipe = await col.deleteOne({ _id: ObjectID(req.body._id) });

                        res.redirect('/');
                    } catch (err) {
                        debug(err.stack);
                    }
                    client.close();
                }());
            }
            else if(type == "edit") {
                res.redirect(`/recipe/edit/${req.body._id}`);
            }
            else if(type == "flag") {
                (async function flagRecipe(){
                    let client;
                    try {
                        client = await MongoClient.connect(url);
                        debug('Connected correctly to server');
                        const db = client.db(dbName);
                        const col = db.collection('recipes');

                        const recipe = await col.findOne({ _id: ObjectID(req.body._id)});

                        let results;
                        if(recipe.flagged) {
                            if(req.user) {
                                if(req.user.admin) {
                                    results = await col.updateOne({ _id: ObjectID(req.body._id) }, {$set: { flagged: false}});
                                }
                            }
                        }
                        else {
                            results = await col.updateOne({ _id: ObjectID(req.body._id) }, {$set: { flagged: true}});
                        }
                        debug(results);       
                        res.redirect(`/recipe/${req.body._id}`);
                    } catch (err) {
                        debug(err.stack);
                    }
                    client.close();
                }());
            }
        });

    return recipeRouter;
}

module.exports = router;