# memories-backend---social-App

## Backend Phase Setup and Configuration:

I built the backend phase using Node.js, Express, and MongoDB. The implementation follows a RESTful API architecture, enabling dynamic fetching and updating of resources for various endpoints like users, posts, comments etc. An email verification endpoint was also established to securely verify user-provided active email address during registration. Meanwhile, authentication and authorization were achieved through JSON Web Tokens (JWT).

The authentication and Authorization mechanism ensures that only registered and verified users can access protected routes in the web app. Hence, users with valid credentials can sign-up, login and securely gain access to the web app.

Furthermore, I utilized a standard backend project structure. Necessary folders, implementation of various Routes, usage of customizable and external dependencies (bcryptjs, cors, helmet, morgan), middleware and view engine were included in this project.

### Folder structure

              controllers, dbConfig, middleware, models, routes, routes, utils, views

### Folder components:

Controllers: contains `usersController`, `postController`, and `authController` responsible for handling different aspects of application logic.  
dbConfig: Includes functions to connect to and access MongoDB Atlas data.  
models: userModel, postModel, friendRequestModel, commentModel, passwordReset, emailVerification  
routes: Encompasses `authRoutes`, `postRoutes`, and `userRoutes`. Defines the API routes and their corresponding logic.  
middleware: consists of `authMiddleware` and `errorMiddleware`. These middlewares plays a crucial role in request processing and error handling.  
utils: Incorporates nodemailer utils for sending email verification and password reset. Houses other utility functions that support various functionalities.  
views: include an EJS script for managing exclusive pages. Provides dynamic rendering for server-side views.  
Public: contains custom css style for the ejs dynamic page.

In conclusion, the backend phase entry point is index.js located in the root folder. This phase can be fired using conventional nodemon or node index.js.
