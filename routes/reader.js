const express = require("express");
const router = express.Router();
const { readerRegistrationRules, proceedValidate, readerLoginRules, tryLogin, readerIsAuthenticated } = require('./validator');

// Route to show the reader homepage (output: blog title, author name, and list of published articles)
router.get("/", (req, res, next) => {
    const reader = req.session.reader;
    let results = {};

    global.db.serialize(function () {
        // Query to get blog title and author name
        global.db.get('SELECT blog_title, author_name FROM Author', function (err, row) {

            (err) ? next(err) : results.blog = row;

            // Query to get list of published articles ordered by publish time
            global.db.all(`SELECT ArticleID, title, published_time FROM Article WHERE status = 'Published' ORDER BY published_time DESC`, function (err, rows) {
                (err) ? next(err) : results.published = rows;
                res.render("./reader/reader-homepage.ejs", { output: results, reader });

            });
        });
    });
});

// Route to render a specific article page
router.get("/read-article", (req, res, next) => {

    const reader = req.session.reader;
    let article_id = req.query.id;
    let isLiked;
    let results = {};

    if (reader) {
        // Query to check if the reader has liked the article
        checkQuery = 'SELECT COUNT(*) AS likeCount FROM Like WHERE ArticleID = ? AND ReaderID = ?'
        checkParams = [article_id, reader.id]

        global.db.get(checkQuery, checkParams, function (err, row) {
            if (err) {
                next(err);
            }

            if (row.likeCount > 0) {
                isLiked = true;
            }
        });
    }

    global.db.serialize(() => {
        // Query to get article details
        global.db.get('SELECT title, published_time, read, content FROM Article WHERE ArticleID = ?', article_id, function (err, row) {

            (err) ? next(err) :
                results.article = row;

            // Update the read count of the article
            global.db.run('UPDATE Article SET read = read + 1 WHERE ArticleID = ?', article_id, function (err) {

                // Query to get comments on the article
                getCommentQuery = 'SELECT Comment.content, Comment.comment_time, Reader.user_name ' +
                    'FROM Comment ' +
                    'JOIN Reader ON Comment.ReaderID = Reader.ReaderID ' +
                    'WHERE Comment.ArticleID = ? ' +
                    'ORDER BY Comment.comment_time DESC'

                global.db.all(getCommentQuery, article_id, function (err, rows) {
                    results.comments = rows;

                    // Query to get the total number of likes on the article
                    likeCountQuery = 'SELECT COUNT(*) AS totalLike FROM Like WHERE ArticleID = ?'

                    global.db.get(likeCountQuery, article_id, function (err, row) {
                        (err) ? next(err) : res.render("./reader/read-article.ejs", { output: results, reader, article_id, isLiked, row });
                    });

                });
            });
        });
    });
});

// Route to render the reader login page
router.get('/login', (req, res) => {
    res.render('./reader/login');
});

// Route to render the reader register page
router.get('/register', (req, res) => {
    res.render('./reader/register');
});

// Route to handle reader registration
router.post('/register-attempted', readerRegistrationRules, proceedValidate, (req, res, next) => {

    const sqlQuery = "INSERT INTO Reader(user_name, email_address, password) VALUES (?, ?, ?)" // Query to insert new register reader
    const queryParams = [req.body.userName, req.body.userEmail, req.body.userPassword]

    global.db.run(sqlQuery, queryParams,
        function (err) {
            (err) ? next(err) : req.flash('success', {msg:"Register Successful !"}), res.redirect('/reader/login');
        });
})

// Route to check reader login credentials
router.post('/login-attempted', readerLoginRules, tryLogin, (req, res, next) => {

    const { userEmail, userPassword } = req.body; // Extract email and password from request body

    // Query to find reader by email 
    global.db.get("SELECT * FROM Reader WHERE email_address = ?", userEmail, function (err, row) {
        if (err) {
            next(err);
        }

        // if no result = no account with the input email
        if (!row) {
            req.flash('error', { msg: 'Account not found' });
            return res.redirect('/reader/login');
        }

        // check password is correct inputed or not
        if (row.password === userPassword) {
            req.session.reader = { id: row.ReaderID, username: row.user_name };
            return res.redirect('/reader');
        } else {
            req.flash('error', { msg: 'Password incorrect' });
            return res.redirect('/reader/login')
        }
    });
});

// Route to insert a comment for an article
router.post('/submitted-comment', readerIsAuthenticated, (req, res, next) => {

    const reader = req.currentReader;
    const { articleID, comment } = req.body;
    const sqlQuery = 'INSERT INTO Comment(ReaderID, ArticleID, content, comment_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)' // query to insert comment
    const sqlParams = [reader.id, articleID, comment]

    global.db.run(sqlQuery, sqlParams, function (err) {
        (err) ? next() : res.redirect('/reader/read-article?id=' + articleID);
    });

});

// Route to add or remove like for an article
router.post('/submitted-like', readerIsAuthenticated, (req, res, next) => {

    const status = req.query.status;
    const reader = req.currentReader;
    let article_id = req.query.id;

    if (!status) {

        const sqlQuery = 'INSERT INTO Like(ArticleID, ReaderID) VALUES (?, ?)' // query to add new like to an article
        const sqlParams = [article_id, reader.id];

        global.db.run(sqlQuery, sqlParams, function (err) {
            (err) ? next(err) : res.redirect('/reader/read-article?id=' + article_id);
        });

    } else {

        const sqlQuery = 'DELETE FROM Like WHERE ReaderID = ? AND ArticleID = ?' // query to remove like from an article
        const sqlParams = [reader.id, article_id];

        global.db.run(sqlQuery, sqlParams, function (err) {
            (err) ? next(err) : res.redirect('/reader/read-article?id=' + article_id);
        });

    }


});

// Route to destroy session and log out from reader page
router.get('/logout', (req, res) => {
    req.session.reader = null;
    res.redirect('/reader/login/');
});

// Error handling middleware - to show an error message on website and console log the error when error occur.
router.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack trace
    res.status(500).send('Something broken!'); // Send a 500 status code and a message
});

// Export the router object so index.js can access it
module.exports = router;