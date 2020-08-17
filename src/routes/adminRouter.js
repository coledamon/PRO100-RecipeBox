const express = require('express');
const {MongoClient} = require('mongodb');
const debug = require('debug')('app:mongo');
const adminRouter = express.Router();

const recipes = [{name: 'chicken alfredo', prep_time: '5 mins', cook_time: '30 mins', ingredients: ['chicken', 'noodles', 'idk whatever alfredo sauce is made of']}
                ,{name: 'basil pesto pasta', prep_time: '15 mins', cook_time: '20 mins', ingredients: ['basil', 'pine nuts', 'minced garlic', 'olive oil', 'salt & pepper', 'parmesan cheese']}];

function router() {
    adminRouter.route('/')
    .get((req, res) => {
        const url = 'mongodb://localhost:27017';
        const dbName = 'Paughers';

        (async function mongo(){
            let client;
            try {
                client = await MongoClient.connect(url);
                debug('Connected correctly to server');

                const db = client.db(dbName);

                const response = await db.collection('recipes').insertMany(recipes);
                res.json(response);
            } catch (err) {
                debug(err.stack);
            }

            client.close();
        }())
    });
    return adminRouter;
}

module.exports = router;