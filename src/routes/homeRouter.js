const express = require('express');
const homeRouter = express.Router();

module.exports = function router(nav) {
    homeRouter.route('/')
        .get((req, res) => {
            res.render('index', {nav});
        });
    return homeRouter;
}
