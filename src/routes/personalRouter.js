const express = require('express');
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:personalRouter');
const personalRouter = express.Router();

function router(nav) {
    personalRouter.use((req, res, next) => {
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
    personalRouter.route('/')
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
                    
                    const recipes = await col.find({"creator" : `${req.user.username}`}).sort("name", 1).toArray();

                    res.render('personalPosts', {nav, recipes});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        });
    return personalRouter;
}

module.exports = router;