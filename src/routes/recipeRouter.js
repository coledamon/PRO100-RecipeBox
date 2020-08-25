const express = require('express');
const {MongoClient, ObjectID} = require('mongodb');
const debug = require('debug')('app:recipeRouter');
const recipeRouter = express.Router();

function router(nav) {
    recipeRouter.use((req, res, next) => {
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
        (async function addRecipe(){
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');
                const db = client.db(dbName);
                const col = db.collection('recipes');
                const recipe = {name, prep_time, cook_time, description, ingredients, directions, creator: req.user.username, public};
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
                
                res.render('recipeEdit', {nav, recipe, user: req.user});
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
        });
    return recipeRouter;
}

module.exports = router;