const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Expo = require('expo-server-sdk');
const { values } = require('lodash');
const expo = new Expo();

admin.initializeApp();

const db = admin.database();
const usersRef = db.ref('users');
const messagesRef = db.ref('messages');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.push = functions.https.onRequest((req, res) => {
  const { uid: senderUid, messageId } = req.query;
  messagesRef.child(senderUid).child(messageId).once('value')
    .then(_ => _.val())
    .then(({ body }) => {
      usersRef
        .once('value')
        .then(_ => _.val())
        .then((users) => {
          const messages = values(users).map(({ expoPushToken }) => {
            return {
              to: expoPushToken,
              sound: 'default',
              body,
              data: { withSome: 'data' },
            };
          });
          const chunks = expo.chunkPushNotifications(messages);
          chunks.map((chunk) => {
            expo.sendPushNotificationsAsync(chunk);
          });
          res.send('ok');
        });
    });
});
