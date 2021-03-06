/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');

var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var expressValidator = require('express-validator');

/**
 * API keys
 */
var secrets = require('./config/secrets');

/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var activityController = require('./controllers/activity');
var experienceController = require('./controllers/experience');
var logController = require('./controllers/log');
var interceptorController = require('./controllers/interceptor');

/**
 * Create cors support.
 */
var cors = require('cors')

/**
 * Create Express server.
 */
var app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});



/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(logger('dev'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(flash());
app.use(lusca({
  csrf: false, //Warning, this is now bad
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

//Use CORS-enabled to make it easier to code
app.use(cors())

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.post('/postRemoteSignup', cors(), userController.postRemoteSignup); //'This is CORS-enabled for all origins!'
app.post('/postRemoteLogin', cors(), userController.postRemoteLogin); //'This is CORS-enabled for all origins!'
app.post('/postRemoteLogout', cors(), userController.postRemoteLogout); //'This is CORS-enabled for all origins!'

/**
 * Interceptor routes.
 */

app.get('/logsOverview', cors(), interceptorController.logsOverview); //'This is CORS-enabled for all origins!'
app.get('/characterLengths', cors(), interceptorController.characterLengths); //'This is CORS-enabled for all origins!'
app.get('/wordLengths', cors(), interceptorController.wordLengths); //'This is CORS-enabled for all origins!'
app.get('/logHasWord', cors(), interceptorController.logHasWord); //'This is CORS-enabled for all origins!'

app.get('/eventSummary', cors(), interceptorController.eventSummary); //'This is CORS-enabled for all origins!'

app.get('/experiencesOverview', cors(), interceptorController.experiencesOverview); //'This is CORS-enabled for all origins!'
app.get('/experiencesStatistics', cors(), interceptorController.experiencesStatistics); //'This is CORS-enabled for all origins!'
app.get('/experienceHasWord', cors(), interceptorController.experienceHasWord); //'This is CORS-enabled for all origins!'
app.get('/experienceContainsLog', cors(), interceptorController.experienceContainsLog); //'This is CORS-enabled for all origins!'

app.get('/activitiesOverview', cors(), interceptorController.activitiesOverview); //'This is CORS-enabled for all origins!'
app.get('/activitiesStatistics', cors(), interceptorController.activitiesStatistics); //'This is CORS-enabled for all origins!'
app.get('/activityHasWord', cors(), interceptorController.activityHasWord); //'This is CORS-enabled for all origins!'
app.get('/activityContainsExperience', cors(), interceptorController.activityContainsExperience); //'This is CORS-enabled for all origins!'

app.get('/userSpokeUniqueWord', cors(), interceptorController.userSpokeUniqueWord); //'This is CORS-enabled for all origins!'
app.get('/userDidActivityWithLog', cors(), interceptorController.userDidActivityWithLog); //'This is CORS-enabled for all origins!'

app.get('/friendsOverview', cors(), interceptorController.friendsOverview); //'This is CORS-enabled for all origins!'

/**
 * Activity routes.
 */

app.route('/activities')
	.get(activityController.listByLogedInUser)
	.post(/*userController.requiresLogin,*/ activityController.create);

app.route('/publicActivities')
	.get(activityController.listPublic)
	.post(/*userController.requiresLogin,*/ activityController.create);

app.route('/activities/:activityId')
	.get(/*userController.requiresLogin, cors(),*/ activityController.read)
	.put(/*userController.requiresLogin, cors(),*/ activityController.update)
	.delete(/*userController.requiresLogin, cors(),*/ activityController.delete);

// Finish by binding the Activity middleware
app.param('activityId', activityController.activityByID);

/**
 * Experience routes.
 */

app.route('/experiences')
	.get(experienceController.listByLogedInUser)
	.post(/*users.requiresLogin,*/ experienceController.create);

app.route('/publicExperiences')
	.get(experienceController.listPublic)
	.post(/*users.requiresLogin,*/ experienceController.create);

app.route('/experiences/:experienceId')
  .get(/*users.requiresLogin, experienceController.hasAuthorization,*/ experienceController.read)
  .put(/*users.requiresLogin, experienceController.hasAuthorization,*/ experienceController.update)
  .delete(/*users.requiresLogin, experienceController.hasAuthorization,*/ experienceController.delete);

// Finish by binding the Experience middleware
app.param('experienceId', experienceController.experienceByID);

/**
 * Log routes.
 */

app.route('/logs')
	.get(logController.listByLogedInUser)
	.post(/*users.requiresLogin,*/ logController.create);

app.route('/publicLogs')
	.get(logController.listPublic)
	.post(/*users.requiresLogin,*/ logController.create);

app.route('/logs/:logId')
	.get(/*users.requiresLogin, logController.hasAuthorization,*/ logController.read)
	.put(/*users.requiresLogin, logController.hasAuthorization,*/ logController.update)
	.delete(/*users.requiresLogin, logController.hasAuthorization,*/ logController.delete);

/**
 * Affect routes.
 */
app.route('/analyzeEmotionSet')
	.post(/*users.requiresLogin,*/ interceptorController.analyzeEmotionSet);

app.get('/retrieveAllRunAnalyses', cors(), interceptorController.retrieveAllRunAnalyses); //'This is CORS-enabled for all origins!'
app.get('/retrieveRunAnalysesStats', cors(), interceptorController.retrieveRunAnalysesStats); //'This is CORS-enabled for all origins!'
app.get('/retrieveRunAnalysis', cors(), interceptorController.retrieveRunAnalysis); //'This is CORS-enabled for all origins!'


// Finish by binding the Log middleware
app.param('logId', logController.logByID);

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
