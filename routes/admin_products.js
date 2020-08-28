const express = require('express');
const router = express.Router();
const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const resizeImg = require('resize-img');

//Is Admin
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;

//Get Product model Mangoose
let Product = require('../models/product');

//Get Category model Mangoose
let Category = require('../models/category');

//Get Product index
router.get('/', isAdmin, function (req, res) {
    let count;

    Product.countDocuments((err, c) => {
        count = c;
        Product.find((err, products) => {
            res.render('admin/products', {
                products: products,
                count: count
            });
        });
    });
});


//POST Add product
router.post('/add-product', function (req, res) {
    let imageFile = req.files != null ? (typeof req.files.image !== "undefined" ? req.files.image.name : "") : "";

    req.checkBody('title', 'Title must be with value').notEmpty();
    req.checkBody('description', 'Description must be with value').notEmpty();
    req.checkBody('price', 'Price must be with value').isDecimal();
    req.checkBody('image', 'Image must be uploaded').isImage(imageFile);

    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase();
    let category = req.body.category;
    let price = req.body.price;
    let description = req.body.description;

    let errors = req.validationErrors();
    if (errors) {
        Category.find((err, categories) => {

            res.render('admin/add_product', {
                errors: errors,
                title: title,
                description: description,
                categories: categories,
                price: price
            });
        });
    } else {
        Product.findOne({ slug: slug }, (err, product) => {
            if (product) {
                req.flash('danger', 'Product title exists, choose another one');

                Category.find((err, categories) => {
                    res.render('admin/add_product', {
                        title: title,
                        description: description,
                        categories: categories,
                        price: price
                    });
                });
            } else {
                let parsedPrice = parseFloat(price).toFixed(2);
                let product = new Product({
                    title: title,
                    description: description,
                    category: category,
                    price: parsedPrice,
                    image: imageFile
                });

                product.save(err => {
                    if (err) {
                        return console.log(err);
                    }

                    mkdirp.sync(`public/product_images/${product._id}`);
                    mkdirp.sync(`public/product_images/${product._id}/gallery`);
                    mkdirp.sync(`public/product_images/${product._id}/gallery/thumbs`);

                    if (imageFile != "") {
                        let productImage = req.files.image;
                        let path = 'public/product_images/' + product._id + '/' + imageFile;

                        productImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }
                    req.flash('success', `Product "${product.title}" Added!`);
                    res.redirect('/admin/products');

                });
            }
        });
    }
});

//POST Edit product
router.post('/edit-product/:id', function (req, res) {
    let imageFile = req.files != null ? (typeof req.files.image !== "undefined" ? req.files.image.name : "") : "";

    req.checkBody('title', 'Title must be with value').notEmpty();
    req.checkBody('description', 'Description must be with value').notEmpty();
    req.checkBody('price', 'Price must be with value').isDecimal();
    req.checkBody('image', 'Image must be uploaded').isImage(imageFile);

    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase();
    let category = req.body.category;
    let price = req.body.price;
    let description = req.body.description;
    let pImage = req.body.image;
    let id = req.params.id;

    let errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product' + id);
    } else {
        Product.findOne({ slug: slug, _id: { '$ne': id } }, (err, product) => {
            if (err) {
                console.log(err);
            }

            if (product) {
                req.flash('danger', 'Product title exists, choose another one');
                res.redirect('/admin/products/edit-product' + id);
            } else {

                Product.findById(id, (err, product) => {
                    if (err) return console.log(err);

                    product.title = title;
                    product.slug = slug;
                    product.description = description;
                    product.price = parseFloat(price).toFixed(2);
                    product.category = category;
                    if (imageFile != "") {
                        product.image = imageFile;
                    }

                    product.save(err => {
                        if (err) return console.log(err);

                        if (imageFile != "") {
                            if (pImage != "") {
                                fs.remove('public/product_images/' + id + '/' + pImage, err => {
                                    console.log(err);
                                });
                            }
                            let productImage = req.files.image;
                            let path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });
                        }
                        req.flash('success', `Product "${product.title}" Edited!`);
                        res.redirect('/admin/products');
                    });
                });
            }
        });
    }

});

//Get add product
router.get('/add-product', isAdmin, function (req, res) {
    Category.find((err, categories) => {

        res.render('admin/add_product', {
            title: '',
            description: '',
            categories: categories,
            price: ''
        });
    });
});

//Get edit product
router.get('/edit-product/:id', isAdmin, function (req, res) {
    let errors;
    if (req.session.errors) errors = req.session.errors;
    req.session.errors = null;

    Category.find((err, categories) => {
        if (err) return console.log(err);

        Product.findById(req.params.id, (err, product) => {
            if (err) {
                console.log(err);
                res.redirect('/admin/products');
            } else {
                let galleryDir = 'public/product_images/' + product._id + '/gallery';
                let galleryImages = null;

                fs.readdir(galleryDir, (err, files) => {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/edit_product', {
                            title: product.title,
                            errors: errors,
                            description: product.description,
                            categories: categories,
                            category: product.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(product.price).toFixed(2),
                            image: product.image,
                            galleryImages: galleryImages,
                            id: product._id
                        });
                    }
                });
            }
        });
    });
});

//GET Delete product
router.get('/delete-product/:id', isAdmin, function (req, res) {
    let id = req.params.id;
    let path = 'public/product_images/' + id;

    fs.remove(path, (err) => {
        if (err) { console.log(err); }
        else {
            Product.findByIdAndRemove(req.params.id, (err, product) => {
                if (err) return console.log(err);

                req.flash('success', ` Product "${product.title}" Deleted!`);
                res.redirect('/admin/products');
            });
        }

    });

});

//GET Delete image
router.get('/delete-image/:image', isAdmin, function (req, res) {
    let id = req.query.id;
    let image = req.params.image;
    let originImage = 'public/product_images/' + id + '/gallery/' + image;
    let thumbPath = 'public/product_images/' + id + '/gallery/thumbs/' + image;

    fs.remove(originImage, (err) => {
        if (err) { console.log(err); }
        else {
            fs.remove(thumbPath, (err) => {
                if (err) { console.log(err); }
                else {
                    req.flash('success', ` Image "${req.params.image}" Deleted!`);
                    res.redirect('/admin/products/edit-product/' + id);
                }
            });
        }
    });

});

//Post product gallery
router.post('/product-gallery/:id', function (req, res) {

    let productImage = req.files.file;
    let id = req.params.id;
    let path = 'public/product_images/' + id + '/gallery/' + productImage.name;
    let thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + productImage.name;

    productImage.mv(path, (err) => {
        if (err) console.log(err);
        resizeImg(fs.readFileSync(path), { width: 100, height: 100 }).then(buff => {
            fs.writeFileSync(thumbsPath, buff);
        });
    });
    res.sendStatus(200);
});


//Exports
module.exports = router;