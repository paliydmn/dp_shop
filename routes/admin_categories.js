const express = require('express');
const router = express.Router();

//Is Admin
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;

//Get category model Mangoose
let Category = require('../models/category');

//Get categories index
router.get('/', isAdmin, function (req, res) {
    Category.find((err, categories) => {
        if(err) return console.log(err);

        res.render('admin/categories', {
            categories: categories
        });
    });
});

//POST reorder pages
router.post('/reorder-pages', function (req, res) {
    let ids = req.body['id[]'];

    let count = 0;
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        count++;
        (function (count) {

            Category.findById(id, (err, category) => {
                category.sorting = count;
                category.save(err => {
                    return console.log(err);
                });
            });
        })(count);
    }
});


//POST Add category
router.post('/add-category', function (req, res) {
    req.checkBody('title', 'Title must be with value').notEmpty();
    
    let title = req.body.title;
    let slug = req.body.title.replace(/\s+/g, '-').toLowerCase();
  
    let errors = req.validationErrors();
    if (errors) {
        res.render('admin/add_category', {
            errors: errors,
            title: title
        });
    } else {
        Category.findOne({ slug: slug }, (err, category) => {
            if (category) {
                req.flash('danger', 'Category slug exists, choose another one');
                res.render('admin/add_category', {
                    errors: errors,
                    title: title
                });
            } else {
                let category = new Category({
                    title: title,
                    slug: slug
                });

                category.save(err => {
                    if (err) {return console.log(err);}
                    setCategoriesLocals(req);
                    req.flash('success', 'Category Added!');
                    res.redirect('/admin/categories');
                });
            }
        });
        console.log('Success');
    }

});

//POST Edit category
router.post('/edit-category/:id', function (req, res) {

    req.checkBody('title', 'Title must be with value').notEmpty();
    let title = req.body.title;
    let slug = title.replace(/\s+/g, '-').toLowerCase();
    let id = req.params.id;


    let errors = req.validationErrors();
    if (errors) {
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id
        });
    } else {
        Category.findOne({ slug: slug, _id: { '$ne': id } }, (err, category) => {
            if (category) {
                req.flash('danger', 'Category title exists, choose another one');
                res.render('admin/edit_category', {
                    errors: err,
                    title: title,
                    id: id
                });
            } else {
                Category.findById(id, (err, category) => {
                    if (err) return console.log(err);

                    category.title = title;
                    category.slug = slug;

                    category.save(err => {
                        if (err) return console.log(err);
                        setCategoriesLocals(req);
                        req.flash('success', 'Category Edited!');
                        res.redirect('/admin/categories');
                    });
                });

            }
        });
        console.log('Success');
    }

});

//Get add category
router.get('/add-category', isAdmin, function (req, res) {
    res.render('admin/add_category', {
        title: ''
    });

});

//Get edit category
router.get('/edit-category/:id', isAdmin, function (req, res) {
    Category.findById(req.params.id, (err, category) => {
        if (err) return console.log(err);

        res.render('admin/edit_category', {
            title: category.title,
            id: category._id
        });
    });
});

//GET Delete category
router.get('/delete-category/:id', isAdmin, function (req, res) {
    Category.findByIdAndRemove(req.params.id, (err, pages) => {
        if (err) return console.log(err);
        setCategoriesLocals(req);

        req.flash('success', 'Category Deleted!');
        res.redirect('/admin/categories');
    });
});


//Exports
module.exports = router;

function setCategoriesLocals(req) {
    Category.find((err, categories) => {
        if (err)
            console.log(err);
        else {
            req.app.locals.categories = categories;
        }
    });
}
