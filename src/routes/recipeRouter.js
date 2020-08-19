const express = require('express');
const {MongoClient, ObjectID} = require('mongodb');
const debug = require('debug')('app:recipeRouter');
const recipeRouter = express.Router();

function router(nav) {
    recipeRouter.use((req, res, next) => {
        if(!req.user) {
            nav[2].title = "";
        }
        else {
            nav[2] = {link: "/recipe/create", title:"Create"};
        }
        next();
    });
    
    recipeRouter.route("/create")
    .get((req, res) => {
        res.render("recipeCreate", {nav});
    })
    .post((req, res) => {
        // const {field1, field2} = req.body;
        // const url = 'mongodb://localhost:27017';
        // const dbName = 'Paughers';
        // (async function addRecipe(){
        //     let client;
        //     try {
        //         client = await MongoClient.connect(url);
        //         debug('Connected correctly to server');
        //         const db = client.db(dbName);
        //         const col = db.collection('recipes');
        //         const recipe = {};
        //         const names = await col.find().toArray();
        //         let nameFound = false;
        //         for(let i = 0; i < names.length; i++) {
        //             if(names[i].name.toLowerCase() == name.toLowerCase()) {
        //                 nameFound = true;
        //                 break;
        //             }
        //         }
        //         if(!userFound) {
        //             const results = await col.insertOne(user);
        //             debug(results);        
        //             req.login(results.ops[0], () => {
        //                 res.redirect(results.ops[0]._id);
        //             });
        //         }
        //         else {
        //             res.render("recipeCreate", {nav, error: "A recipe with this name already exists, please choose a different one."});
        //         }
        //     } catch (err) {
        //         debug(err.stack);
        //     }
        //     client.close();
        // }());
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
                    debug(recipe);
                    
                    res.render('recipe', {nav, recipe});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
    });
    return recipeRouter;
}

module.exports = router;