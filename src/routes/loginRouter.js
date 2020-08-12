const express = require('express');

const router = express.Router();

router.route('/')
    .get((req, res) => {
        res.render('login', {nav: [{link: "/", title: "Home"}, {link: "/allPosts", title: "All Posts"}]})
    });

module.exports = router;