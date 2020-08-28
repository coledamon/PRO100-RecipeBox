const express = require('express');
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:flaggedRouter');
const flaggedRouter = express.Router();

function router(nav) {
    flaggedRouter.use((req, res, next) => {
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
    flaggedRouter.route('/')
        .get((req, res) => {
            const url = 'mongodb://localhost:27017';
            const dbName = 'Paughers';

            (async function mongo(){
                debug(req.user);
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');

                    const db = client.db(dbName);

                    const col = db.collection('recipes')
                    
                    const recipes = await col.find({"flagged" : true }).sort("name", 1).toArray();

                    res.render('flaggedRecipes', {nav, recipes});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        });
    return flaggedRouter;
}

module.exports = router;