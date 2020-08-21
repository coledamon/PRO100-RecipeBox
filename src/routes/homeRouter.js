const express = require('express');
const homeRouter = express.Router();
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:allRouter');


module.exports = function router(nav) {
    homeRouter.use((req, res, next) => {
        
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
    homeRouter.route('/')
        .get((req, res) => {
            const url = 'mongodb://localhost:27017';
            const dbName = 'Paughers';

            (async function mongo(){
                let client;
                try {
                    client = await MongoClient.connect(url);
                    debug('Connected correctly to server');

                    const db = client.db(dbName);

                    const col = await db.collection('recipes')
                    
                    const recipes = await col.find().toArray();

                    res.render('index', {nav, recipes, user: req.user});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        });
    return homeRouter;
}
