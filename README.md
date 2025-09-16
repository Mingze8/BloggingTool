### Databases, Network and the Web - Coursework for Midterm ###

## List of additional libraries: ##
* bootstrap - version 5.3.3
* connect-flash - version 0.1.1
* dotenv - version 16.4.5
* express-session - version 1.18.0
* express-validator - version 7.1.0
* generate-password - version 1.7.1

## Guideline to run the application ##

After running the `npm run start` the console will show a secret code in the following format:

Current Admin Secret Code: `RANDOM_SECRET_CODE` - Use the random generated code as the login password for author endpoint.

## Default login info of the application ##

Reader account:
Email - reader1@gmail.com
Password - reader1@123

## Route for accessing the application ##

* Main Page
http://localhost:3000/ 

* Author Page
http://localhost:3000/author/login (Login Page)
http://localhost:3000/author (Homepage)
http://localhost:3000/author/setting/ (Setting Page)
http://localhost:3000/author/new-article?mode=new (Create article page)
http://localhost:3000/author/edit-article?id=1&mode=edit (Edit article page)

* Reader Page
http://localhost:3000/reader/login/ (Login Page)
http://localhost:3000/reader/register/ (Register Page)
http://localhost:3000/reader (Homepage)
http://localhost:3000/reader/read-article?id=1 (Article Page)
