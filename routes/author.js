const express = require("express");
const router = express.Router();
const { authorLoginRule, proceedAuthorValidate, authorIsAuthenticated, articleCheckRule, proceedArticleValidate } = require("./validator");

// Route to show the homepage of author (output: blog title, author name, drafts and published articles)
router.get("/", authorIsAuthenticated, (req, res, next) => {
    let results = {};

    global.db.serialize(() => {

        blogQuery = 'SELECT blog_title, author_name FROM Author'; // query to get blog title and author name

        // execute the query and add the result row into results array
        global.db.get(blogQuery, function (err, row) {
            if (err) {
                next(err);
            }
            results.blog = row;

            draftQuery = `SELECT ArticleID, title, created_time, last_modified FROM Article WHERE status = 'Draft'`; // query to get list of draft article
            
            // execute the query and replace the last modified data which is null with "No Record" and add the result into results array
            global.db.all(draftQuery, function (err, rows) {
                if (err) {
                    next(err);
                }
                rows.forEach(function (result) {
                    result.last_modified == null ? result.last_modified = "No Record" : result.last_modified;
                });
                results.draft = rows;


                likeCountQuery = 'SELECT ArticleID, COUNT(*) AS totalLike FROM Like GROUP BY ArticleID'; // query to get the like count by article id
                // query to get a list of published article
                publishedQuery = `SELECT a.ArticleID, a.title, a.created_time, a.last_modified, a.published_time, a.read, COALESCE(l.totalLike, 0) AS totalLike FROM Article a LEFT JOIN (${likeCountQuery}) l ON a.ArticleID = l.ArticleID WHERE a.status = 'Published'`;
                
                // execute the query and replace the last modified data which is null with "No Record" and add the result into results array
                global.db.all(publishedQuery, function (err, rows) {
                    if (err) {
                        next(err);
                    }
                    rows.forEach(function (row) {
                        row.last_modified == null ? row.last_modified = "No Record" : row.last_modified;
                    });
                    results.published = rows;
                    (err) ? next(err) : res.render("./author/author-homepage.ejs", { output: results });

                });
            });
        });
    });
});

// Route to render author setting page
router.get("/setting", authorIsAuthenticated, (req, res, next) => {
    blogSettingQuery = 'SELECT blog_title, author_name FROM Author'; // query to get blog title and author name for showing in setting page
    global.db.get(blogSettingQuery, function (err, result) {
        (err) ? next(err) : res.render("./author/setting.ejs", { output: result });
    });
});

// Route to update blog settings (title and author name)
router.post("/updated-blog", (req, res, next) => {
    query = "UPDATE Author SET blog_title = ?, author_name = ?"; // Query to update blog title and author name
    query_parameters = [req.body.blogTitle, req.body.authorName];

    global.db.run(query, query_parameters,
        function (err) {
            (err) ? next(err) : res.redirect("/author");
        }
    );
});

// Route to render new article and edit article page
router.get(['/new-article', '/edit-article'], authorIsAuthenticated, (req, res, next) => {
    let mode = req.query.mode; // 'edit' or 'new'
    let article_id = req.query.id;

    if (mode === 'edit') {
        // Query to get the existing article details for showing in the page
        global.db.get(`SELECT * FROM Article WHERE ArticleID = ?`, article_id, function (err, row) {
            if (err) {
                next(err);
            } else {
                row.last_modified == null ? row.last_modified = "No Record" : row.last_modified;
                res.render("./author/edit-article.ejs", { mode, article_id, output: row });
            }
        });
    }

    if (mode === 'new') {
        res.render("./author/edit-article.ejs", { mode });
    }

});

// Route to create new draft article
router.post("/created-article", articleCheckRule, proceedArticleValidate, (req, res, next) => {
    // Query to insert a new draft article
    query = "INSERT INTO Article(title, content) VALUES (?, ?)";
    query_parameters = [req.body.title, req.body.content];

    global.db.run(query, query_parameters,
        function (err) {
            (err) ? next(err) : res.redirect("/author");
        }
    );
});

// Route to edit an existing article
router.post("/edited-article", (req, res, next) => {
    let article_id = req.query.id;
    query = "UPDATE Article SET title = ?, content = ?, last_modified = CURRENT_TIMESTAMP WHERE ArticleID = ?" // Query to update article details
    query_parameters = [req.body.title, req.body.content, article_id];

    global.db.run(query, query_parameters,
        function (err) {
            (err) ? next(err) : res.redirect("/author");
        }
    );
});

// Route to publish a draft article
router.post("/publish-draft", authorIsAuthenticated, (req, res, next) => {
    let article_id = req.query.id;
    publishQuery = `UPDATE Article SET status = 'Published', published_time = CURRENT_TIMESTAMP WHERE ArticleID = ?` // Query to update the status of an article to 'Published'
    global.db.run(publishQuery, article_id, function (err) {
        (err) ? next(err) : res.redirect("/author");
    });
});

// Route to delete a draft article
router.post("/delete-article", authorIsAuthenticated, (req, res, next) => {
    let article_id = req.query.id;
    deleteQuery = `DELETE FROM Article WHERE ArticleID = ?` // Query to delete an article   
    global.db.run(deleteQuery, article_id, function (err) {
        (err) ? next(err) : res.redirect("/author");
    });
});

// Route to render author login page
router.get("/login", (req, res) => {
    res.render('./author/login.ejs');
})

// Route to check login permission
router.post("/login-attempted", authorLoginRule, proceedAuthorValidate, (req, res, next) => {
    const secret_key = req.body.secretKey;
    // Check if the secret key input is same as the current secret key store in .env file
    if (secret_key === process.env.SECRET_KEY) {
        req.session.author = true;
        res.redirect('/author')
    } else {
        req.flash('error', { msg: 'Incorrect Secret Key' });
        res.redirect('/author/login');
    }
})

// Route to destroy session and log out from author page
router.get('/logout', (req, res) => {
    req.session.author = null;
    res.redirect('/author/login');
});

// Error handling middleware - to show an error message on website and console log the error when error occur.
router.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack trace
    res.status(500).send('Something broken!'); // Send a 500 status code and a message
});

// Export the router object so index.js can access it
module.exports = router;
