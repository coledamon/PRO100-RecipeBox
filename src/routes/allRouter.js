const express = require('express');
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:allRouter');
const allRouter = express.Router();

function router(nav) {
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

                    const col = await db.collection('recipes')
                    
                    const recipes = await col.find().toArray();

                    res.render('allPosts', {nav, recipes});
                } catch (err) {
                    debug(err.stack);
                }
                client.close();
            }());
        });
    return allRouter;
}

module.exports = router;