const express = require('express');
const homeRouter = express.Router();

module.exports = function router(nav) {
    homeRouter.use((req, res, next) => {
        if(!req.user) {
            nav[2].title = "";
        }
        else {
            nav[2] = {link: "/recipe/create", title:"Create"};
        }
        next();
    });
    homeRouter.route('/')
        .get((req, res) => {
            res.render('index', {nav});
        });
    return homeRouter;
}
