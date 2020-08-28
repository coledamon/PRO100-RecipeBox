const express = require('express');
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:allRouter');
const allRouter = express.Router();

function router(nav) {
    allRouter.use((req, res, next) => {
        if(!req.user) {
            nav[2].title = "";
            nav[3].title = "";
            nav[4].title = "";
        }
        else {
            nav[2] = {link: "/personalPosts", title: "Personal Posts"};
            nav[3] = {link: "/recipe/create", title:"Create"};
            nav[4] = {link: "/flaggedRecipes", title: "Flagged Rcipes"};
        }
        next();
    });
    allRouter.route('/')
        .get((req, res) => {
            const url = 'mongodb://localhost:27017';
            const dbName = 'Paughers';

            (async function mongo(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');

                    const db = client.db(dbName);

                    const col = db.collection('recipes')
                    
                    const recipes = await col.find().sort("name", 1).toArray();

                    res.render('allPosts', {nav, recipes, user: req.user});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        });
    return allRouter;
}

module.exports = router;