const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const recipes = require('./tm_recipes.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadData() {
  console.log('Starting data upload to Firestore...');
  const batch = db.batch();

  for (const recipe of recipes) {
    const docRef = db.collection('tm_recipes').doc(recipe.id);
    batch.set(docRef, recipe.data);
  }

  try {
    await batch.commit();
    console.log('Data successfully uploaded!');
  } catch (error) {
    console.error('Failed to upload data:', error);
  }
}

uploadData();
