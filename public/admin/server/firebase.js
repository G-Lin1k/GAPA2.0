const admin = require('firebase-admin');

// Your Firebase Admin SDK service account key file (downloaded from Firebase Console)
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com', // Replace with your Firebase project's database URL
});

module.exports = admin;
