let Router = require('express-promise-router');
let { Message, User, Like } = require('./models');
let { ValidationError } = require('objection');
let Password = require('objection-password');
const passport = require('passport');

let session = require('express-session');


let router = new Router();



// GET /
router.get('/', async(request, response) => {
  let messages = await Message.query()
    .select('messages.id', 'body', 'mood', 'messages.created_at', 'users.screen_name')
    .count('likes.id', {as: 'message_likes'})
    .leftJoin('likes', 'likes.message_id', 'messages.id')
    .leftJoin('users', 'users.id', 'messages.user_id')
    .groupBy('messages.id', 'users.screen_name')
    .orderBy('messages.created_at', 'DESC');

  console.log(messages);

  if (request.user) {
    let user = request.user;
    response.render('index', { messages, user })
  } else {
    response.render('index', { messages });
  }
});

// Authentication

router.get('/sign-up', async(request, response) => {
  response.render('sign-up');
})

router.post('/sign-up', async(request, response) => {
  let newEmail = request.body.email;
  let newPassword = request.body.password;
  let newScreenName = request.body.screenName;

  try {
    const user = await User.query().insert({
      email: newEmail,
      password: newPassword,
      screenName: newScreenName,
    });

    console.log('New User: ', user);

    passport.authenticate('local')(request, response, function () {
      response.redirect('/');
    });

    // response.redirect('/');

  } catch(error) {
    console.log('This registration didn\'t work!');

    if (error instanceof ValidationError) {
      let messages = await Message.query().select('*').orderBy('created_at', 'DESC');
      let errors = error.data;

      response.render('index', { messages, errors });
    } else {
      throw error;
    }
  }
});

router.get('/sign-in', async(request, response) => {
  response.render('sign-in');
});



router.post('/sign-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/sign-in',
    failureFlash: true
  })
);

// Sign out
router.get('/sign-out', function(request, response) {
  request.logout();
  response.redirect('/');
});



/* router.post('/sign-in', async(request, response) => {

  console.log(request.body);
  let emailGiven = request.body.email;
  let passwordGiven = request.body.password;

  const activeUser = await User.query().first().where({
    email: emailGiven,
  });

  console.log(activeUser);
  let passwordValid = await activeUser.verifyPassword(passwordGiven);

  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/sign-in',
    failureFlash: true
  });
}) */

// POST /messages
router.post('/messages', async(request, response) => {

  if (!request.user) {
    response.redirect('/sign-in');
  }

  let messageBody = request.body.body;
  let messageMood = request.body.mood;

  try {
    await Message.query().insert({
      body: messageBody,
      mood: messageMood,
      userId: request.user.id
    });

    response.redirect('/');
  } catch(error) {
    if (error instanceof ValidationError) {
      let messages = await Message.query().select('*').orderBy('created_at', 'DESC');
      let errors = error.data;

      response.render('index', { messages, errors });
    } else {
      throw error;
    }
  }
});

// LIKE a message
router.post('/messages/:messageId/like', async(request, response) => {

  let messageId = Number(request.params.messageId);
  console.log(messageId);

  if (!request.user) {
    response.redirect('/sign-in');
  } else {
    let user = request.user;

    let userLikes = await user.$relatedQuery('likes').where('message_id', messageId);

    console.log("PRINTING OUT USER LIKES: ",userMessageLike);

    /* let userHasLikedMessage = await Message.query()
      .select('*')
      .where({
        messageId: messageId,
        likes(userId): user.id
      })
      .leftJoin('likes', 'likes.message_id', 'messages.id') */
    await Like.query().insert({
      messageId: messageId,
      userId: request.user.id
    });

    response.redirect(`/#${messageId}`);
  }



});

module.exports = router;
