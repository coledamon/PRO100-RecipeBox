const express = require('express');

const router = express.Router();

router.route('/')
    .get((req, res) => {
        res.render('index', {nav: [{link: "/login", title: "Login"}, {link: "/signup", title: "Sign Up"}]});
    });

module.exports = router;