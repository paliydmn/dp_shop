    const express = require('express');
    const router = express.Router();

//Get page model Mangoose
let Page = require('../models/page');

//Get /
router.get('/', function (req, res) {
    Page.findOne({ slug: 'home' }, (err, page) => {
        if (err) return console.log(err);
        res.render('index', {
            title: page.title,
            content: page.content
        });
    });
});

//Get a page
router.get('/:slug', function (req, res) {
    let slug = req.params.slug;
    Page.findOne({ slug: slug }, (err, page) => {
        if (err) return console.log(err);

        if (!page) {
            res.redirect('/');
        } else
            res.render('index', {
                title: page.title,
                content: page.content
            });

    });
});

router.get('/test', function (req, res) {
    res.send('Test here!');
});


//Exports
module.exports = router;