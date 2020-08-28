const express = require('express');
const router = express.Router();
//Is Admin
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;

//Get page model Mangoose
let Page = require('../models/page');

//Get page index
router.get('/', isAdmin, function (req, res) {
    Page.find({}).sort({ sorting: 1 }).exec((err, pages) => {
        console.log(`Pages: ${pages}`);
        console.log(`Err: ${err}`);
        res.render('admin/pages', {
            pages: pages
        });
    });
});

//POST reorder pages
router.post('/reorder-pages', function (req, res) {
    let ids = req.body['id[]'];
    sortPages(ids, () => {
        updateLocalsPage(req);
    });
});


//POST Add page
router.post('/add-page', function (req, res) {

    req.checkBody('title', 'Title must be with value').notEmpty();
    req.checkBody('content', 'Content must be with value').notEmpty();
    let title = req.body.title;
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == '') {
        slug = req.body.title.replace(/\s+/g, '-').toLowerCase();
    }
    let content = req.body.content;

    let errors = req.validationErrors();
    if (errors) {
        res.render('admin/add_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content
        });
    } else {
        Page.findOne({ slug: slug }, (err, page) => {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another one');
                res.render('admin/add_page', {
                    errors: errors,
                    title: title,
                    slug: slug,
                    content: content
                });
            } else {
                let page = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 100
                });

                page.save(err => {
                    if (err) {
                        return console.log(err);
                    }
                    updateLocalsPage(req);
                    req.flash('success', 'Page Added!');
                    res.redirect('/admin/pages');
                });
            }
        });
        console.log('Success');
    }

});

//POST Edit page
router.post('/edit-page/:id', function (req, res) {

    req.checkBody('title', 'Title must be with value').notEmpty();
    req.checkBody('content', 'Content must be with value').notEmpty();
    let title = req.body.title;
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == '') {
        slug = req.body.title.replace(/\s+/g, '-').toLowerCase();
    }
    let content = req.body.content;
    let id = req.params.id;


    let errors = req.validationErrors();
    if (errors) {
        res.render('admin/edit_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        });
    } else {
        Page.findOne({ slug: slug, _id: { '$ne': id } }, (err, page) => {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another one');
                res.render('admin/edit_page', {
                    errors: errors,
                    title: title,
                    slug: slug,
                    content: content,
                    id: id
                });
            } else {

                Page.findById(id, (err, page) => {
                    if (err) return console.log(err);

                    page.title = title;
                    page.slug = slug;
                    page.content = content;

                    page.save(err => {
                        if (err) return console.log(err);

                        updateLocalsPage(req);
                        req.flash('success', 'Page Edited!');
                        res.redirect('/admin/pages');
                    });
                });

            }
        });
        console.log('Success');
    }

});

//Get add page
router.get('/add-page', isAdmin, function (req, res) {
    res.render('admin/add_page', {
        title: '',
        slug: '',
        content: ''
    });

});

//Get edit page
router.get('/edit-page/:id', isAdmin, function (req, res) {
    Page.findById(req.params.id, (err, page) => {
        if (err) return console.log(err);

        res.render('admin/edit_page', {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        });
    });

});

//GET Delete page
router.get('/delete-page/:id', isAdmin, function (req, res) {
    Page.findByIdAndRemove(req.params.id, (err, pages) => {
        if (err) return console.log(err);

        req.flash('success', 'Page Deleted!');
        res.redirect('/admin/pages');
    });
});

function updateLocalsPage(req) {
    Page.find({}).sort({ sorting: 1 }).exec((err, pages) => {
        if (err)
            console.log(err);
        else {
            req.app.locals.pages = pages;
        }
    });
}

function sortPages(ids, callback) {
    let count = 0;
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        count++;
        (function (count) {
            Page.findById(id, (err, page) => {
                page.sorting = count;
                page.save(err => {
                if(err)
                    return console.log(err);
                    ++count;
                    if(count >= ids.length){
                        callback();
                    }
                });
            });
        })(count);
    }
}

//Exports
module.exports = router;

