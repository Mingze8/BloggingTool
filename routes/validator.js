const {body, validationResult} = require('express-validator');

// Function to check if an email already exists in the database
const emailExists = (email) => {
    return new Promise((success, error) => {
        // query to get the number of a specific email is store in the reader table
        global.db.get("SELECT COUNT(email_address) AS emailCount FROM Reader WHERE email_address = ?", email, (err, row) => {
            if (err) {
                return error(err);
            }
            success(row.emailCount > 0); // Resolves true if email exists, false otherwise
        });
    });
};

// Function to check if a username already exists in the database
const userExist = (username) => {
    return new Promise((success, error) => {
        // query to get the number of a specific username is store in the reader table
        global.db.get("SELECT COUNT(user_name) AS userCount FROM Reader WHERE user_name = ?", username, (err, row) => {
            if(err){
                return error(err);
            }
            success(row.userCount > 0); // Resolves true if username exists, false otherwise
        })
    })
}

// Function to check if an article title already exists in the database
const articleExist = (article) => {
    return new Promise((success, error) => {
        // query to get the number of a specific article title is store in the article table
        global.db.get("SELECT COUNT(title) AS titleCount FROM Article WHERE title = ?", article, (err, row) => {
            if(err){
                return error(err);
            }
            success(row.titleCount > 0); // Resolves true if article title exists, false otherwise
        })
    })
}  

// Validation rules for reader registration form
const readerRegistrationRules = [
    body('userName')
        .notEmpty()
        .withMessage("Username is required")
        .isString()
        .withMessage("Username must be string")
        .custom(async (username) => {
            if(await userExist(username)){
                throw new Error('Username already exists!');
            }
        }),
    body('userEmail')
        .isEmail()
        .withMessage("Provide valid email")
        .custom(async (email) => {
            if (await emailExists(email)) {
                throw new Error('Email already exists!');
            }
        }),
    body('userPassword')
        .notEmpty()
        .withMessage("Password is required")
        .isLength({min : 8})
        .withMessage("Password should be at least 8 characters"),
    body('confirmPassword')
        .notEmpty()
        .withMessage("Confirm password is required")
        .custom((value, {req}) => {
            if(value !== req.body.userPassword){
                throw new Error("Password and confirm password do not match");
            }
            return true;
        })
];

// Middleware to check validation errors - if errors exist, prompt error and redirect, else continue to next function
const proceedValidate = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        req.flash('error', errors.array());
        return res.redirect('/reader/register');
    }
    next();
};

// READER - LOGIN

// Validation rules for reader login form
const readerLoginRules = [
    body('userEmail')
        .notEmpty()
        .withMessage("Email is required"),
    body('userPassword')
        .notEmpty()
        .withMessage("Password is required")
];

// Middleware to check login errors - if errors exist, prompt error and redirect, else continue to next function
const tryLogin = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        req.flash('error', errors.array());
        return res.redirect('/reader/login');
    }
    next();
};

// Middleware to check if a reader is authenticated
readerIsAuthenticated = (req, res, next) => {
    if(req.session.reader) {
        req.currentReader = req.session.reader;
        next();
    } else {
        res.redirect('/reader/login');
    }
};

// AUTHOR

// Validation rule for author login
const authorLoginRule = [
    body('secretKey')
        .notEmpty()
        .withMessage("Secret key is required")
];

// Middleware to check validation errors for author login - if errors exist, prompt error and redirect, else continue to next function
const proceedAuthorValidate = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        req.flash('error', errors.array());
        return res.redirect('/author/login');
    }
    next();
};

// Middleware to check if an author is authenticated
authorIsAuthenticated = (req, res, next) => {

    if(req.session.author) {
        next();
    } else {
        req.flash('error', {msg: 'Unauthorized Access is prohibited!'});
        res.redirect('/author/login');
    }
};

// ARTICLE

// Validation rule to check if an article title already exists in the database
const articleCheckRule = [
    body('title')
        .custom(async (title) => {
            if (await articleExist(title)) {
                throw new Error('This article title already exists!');
            }
        }),
];

// Middleware to check validation errors for article creation - if errors exist, prompt error and redirect, else continue to next function
const proceedArticleValidate = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        req.flash('error', errors.array());
        return res.redirect('/author/new-article?mode=new');
    }
    next();
};

// Export all the validation rules and middlewares
module.exports = {
    readerRegistrationRules,
    proceedValidate,
    readerLoginRules,
    tryLogin,
    readerIsAuthenticated,
    authorLoginRule,
    proceedAuthorValidate,
    authorIsAuthenticated,
    articleCheckRule,
    proceedArticleValidate
}