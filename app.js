const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config/database');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const fileUpload = require('express-fileupload');
const passport = require('passport');

//Connect to DB
mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true });
//mongodb+srv://paliydmn_adm:<password>@cluster-shop.iaip7.mongodb.net/<dbname>?retryWrites=true&w=majority
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function () {
    console.log('Connected to DB');
});

//Init app
let app = express();

//View engine setUp 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Set Public folder
app.use(express.static(path.join(__dirname, 'public')));
//Set global Errors variable
app.locals.errors = null;

//Get page model
let Page = require('./models/page');

//Get All pages for Header.ejs view
Page.find({}).sort({ sorting: 1 }).exec((err, pages) => {
    if (err) console.log(err);
    else {
        app.locals.pages = pages;
    }
});

//Get page model
let Category = require('./models/category');

//Get All pages for Header.ejs view
Category.find((err, categories) => {
    if (err) console.log(err);
    else {
        app.locals.categories = categories;
    }
});

// app.get('/', function(req, res){
//     res.send('Ok');
// });
//Express File upload middleware
app.use(fileUpload());

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    //    cookie: { secure: true }
}));

//Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.'),
         root = namespace.shift(),
         formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            let extension = (path.extname(filename)).toLocaleLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                case '.png':
                    return '.png';
                case '.jpeg':
                    return '.jpeg';
                case '':
                    return '.jpg';
                default: return false;
            }
        }
    }
}));

// //Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Passport Init
require('./config/passport')(passport);
//Passport midlleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => {
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next();
});

//Set routes
let users = require('./routes/users.js');
let pages = require('./routes/pages.js');
let products = require('./routes/products.js');
let cart = require('./routes/cart.js');
let adminPages = require('./routes/admin_pages.js');
let adminCategories = require('./routes/admin_categories.js');
let adminProducts = require('./routes/admin_products.js');
const category = require('./models/category');

app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products', products);
app.use('/cart', cart);
app.use('/users', users);
app.use('/', pages);

// app.get('/', function (req, res){
//     res.render('index', {title: 'Home!'});
// });
//Start the server
let port = 3334;

app.listen(port, function () {
    console.log('Server is listening on ' + port);
});


