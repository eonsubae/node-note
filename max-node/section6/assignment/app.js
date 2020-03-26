const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const addUserRoutes = require('./routes/add-user');
const usersRoutes = require('./routes/user-list');

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(addUserRoutes);
app.use(usersRoutes.router);

app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle : 'Page Not Found', path: '404' });
})

app.listen(3000);