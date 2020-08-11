const express = require('express');

const router = express.Router();

router.route('/')
    .get((req, res) => {
        res.render('allPosts', {nav: [{link: "/login", title: "Login"}, {link: "/signup", title: "Sign Up"}]})
    });

module.exports = router;