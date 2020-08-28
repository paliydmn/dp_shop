const express = require('express');
const router = express.Router();
var fs = require('fs-extra');

//Get product model Mangoose
let Product = require('../models/product');

//Get category model Mangoose
let Category = require('../models/category');

//Get /
router.get('/', function (req, res) {
    Product.find((err, products) => {
        if (err) return console.log(err);
        res.render('all_products', {
            title: 'All Products',
            products: products
        });
    });
});

/*
 * GET products by category
 */
router.get('/:category', function (req, res) {

    var categorySlug = req.params.category;

    Category.findOne({slug: categorySlug}, function (err, c) {
        Product.find({category: categorySlug}, function (err, products) {
            if (err)
                console.log(err);

                if(products.length > 0) {
                    res.render('cat_products', {
                        title: c.title,
                        products: products
                    });
                }  else {
                    res.render('cat_products', {
                        title: "No products",
                        products: ""
                    }); 
                }

        });
    });

});
//Get products details
router.get('/:category/:product', function (req, res) {

    var galleryImages = null;
   // var loggedIn = (req.isAuthenticated()) ? true : false;
    Product.findOne({slug: req.params.product}, function (err, p) {
        if (err) {
            console.log(err);
        } else {
            var galleryDir = 'public/product_images/' + p.id + '/gallery';

            fs.readdir(galleryDir, function (err, files) {
                if (err) {
                    console.log(err);
                } else {
                    galleryImages = files;

                    res.render('product', {
                        title: p.title,
                        p: p,
                        galleryImages: galleryImages,
                        loggedIn: 'true'
                    });
                }
            });
        }
    });

});

//Get a product
router.get('/:slug', function (req, res) {
    let slug = req.params.slug;
    Product.findOne({ slug: slug }, (err, product) => {
        if (err) return console.log(err);

        if (!product) {
            res.redirect('/');
        } else
            res.render('index', {
                title: product.title,
                content: product.content
            });

    });
});

router.get('/test', function (req, res) {
    res.send('Test here!');
});


//Exports
module.exports = router;