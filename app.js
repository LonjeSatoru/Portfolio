require('dotenv').config()

const logger = require('morgan')
const express = require('express')
const errorHandler = require('errorhandler')

const port = 3000
const app = express()
const path = require('path')

const Prismic = require('@prismicio/client');

//Initialize Prismic.io api
const initApi = (req) => {
  return Prismic.createClient(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
    fetch,
  });
};

//Link Resolver
const handleLinkResolver = (doc) => {

  if (doc.type === 'about') {
    return '/about';
  }

  return '/';
};

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(errorHandler())
app.use(express.static(path.join(__dirname, 'public')))



//Middleware to add prismic content
app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
    linkResolver: handleLinkResolver,
  };

  res.locals.Prismic = Prismic;
  res.locals.Link = handleLinkResolver;

  next();
});

//Handle API request
const handleRequest = async (api) => {
  const [navigation, home, about] =
    await Promise.all([
      api.getSingle('navigation'),
      api.getSingle('home'),
      api.getSingle('about'),
    ]);

  console.log(home.data.introduction[0].image);

  return {
    home,
    about,
    navigation,
  };
};

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.locals.basedir = app.get('views');
('');

//=======================All the routes - these can have their own file/folder========================
app.get('/', async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);

  res.render('pages/home', {
    ...defaults,
  });
});

app.get('/about', async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);

  res.render('pages/about', {
    ...defaults,
  });
});

//=====================================Undefined routes error handling==================
app.all('*', async (req, res, next) => {
  res.render('pages/Four04')
})

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Code 500: Something Went Wrong'
  res.status(statusCode).send(err.message)
})

//=======================Connecting to port====================================
app.listen(process.env.PORT || port, () => {
  console.log(`App listening at http://localhost:${port}`)
})