const express = require('express');
const { check, body } = require('express-validator/check');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login', 
  [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value, { req }) => {
      User.findOne({ email: req.body.email })
        .then(user => {
          if (!user) {
            return Promise.reject('Invalid email. Please check your email address.');
          }
        })
    }),
    body('password', 'Please enter a password with only numbers and text and least 5 characters.')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim()
  ]
  ,
  authController.postLogin);

router.post(
  '/signup', 
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        User
          .findOne({ email: email })
          .then(userDoc => {
            if (userDoc) {
              return Promise.reject('E-Mail exists already, please pick a different one.');
            }
          });
        // if (value === 'test@test.com') {
        //   throw new Error('This email address if forbidden.');
        // }
        // return true;
      })
      .normalizeEmail(),
    body('password', 'Please enter a password with only numbers and text and least 5 characters.')
      .isLength({ min : 5 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password have to match!');
        }
        return true;
      })
  ], 
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
