
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

CREATE TABLE IF NOT EXISTS Reader (
    ReaderID INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    email_address TEXT NOT NULL,
    password TEXT NOT NULL,
    UNIQUE (user_name, email_address)
);

CREATE TABLE IF NOT EXISTS Author (
    AuthorID INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_title TEXT NOT NULL,
    author_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Article (
    ArticleID INTEGER PRIMARY KEY AUTOINCREMENT,
    AuthorID INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    read INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK ( status IN ('Draft', 'Published') ) DEFAULT 'Draft',
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP,
    published_time TIMESTAMP,
    FOREIGN KEY (AuthorID) REFERENCES Author(AuthorID) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Like (
    ArticleID INTEGER,
    ReaderID INTEGER,
    FOREIGN KEY (ArticleID) REFERENCES Article(ArticleID) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (ReaderID) REFERENCES Reader(ReaderID) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Comment (
    CommentID INTEGER PRIMARY KEY AUTOINCREMENT,
    ReaderID INTEGER,
    ArticleID INTEGER,
    content TEXT,
    comment_time TIMESTAMP,
    FOREIGN KEY (ReaderID) REFERENCES Reader(ReaderID) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (ArticleID) REFERENCES Article(ArticleID) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Insert default data (if necessary here)

-- Set up reader
INSERT INTO Reader ('user_name', 'email_address', 'password') VALUES ('Reader1', 'reader1@gmail.com', 'reader1@123');

-- Set up blog
INSERT INTO Author ('blog_title', 'author_name') VALUES ('Cake Recipe', 'Simon Star');

-- Set up article
INSERT INTO Article ('title', 'content', 'read') VALUES ('Chocolate Cake', 'This is the recipe', 0);
INSERT INTO Article ('title', 'content', 'read') VALUES ('Cheese Cake', 'This is the recipe 2', 1);

COMMIT;

