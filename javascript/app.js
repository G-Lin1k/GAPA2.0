const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');
const MongoStore = require('connect-mongo');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const bodyParser = require('body-parser');
const svgCaptcha = require('svg-captcha');
const port = process.env.PORT || 3010;
const mongoose = require('mongoose');
const express = require('express');
const app = express();

const User = require('../models/user');

// Connect to MongoDB
const uri = "mongodb+srv://UnknownLink110:UnknownLink110@website.waf2lcl.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use a secret key (replace with your secure key)
const secretKey = 'GAPAwesome'.padEnd(32, '\0').slice(0, 32);

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use the session middleware with MongoDB store
app.use(
  session({
    secret: 'GAPA',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: uri, // Provide the MongoDB connection URI
      mongooseConnection: mongoose.connection,
    }),
    cookie: { maxAge: 3600000 }, // 1 hour in milliseconds
  })
);

// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    // If the user is logged in, proceed to the next middleware or route handler
    next();
  } else {
    // If the user is not logged in, redirect to the login page or send an unauthorized response
    res.redirect('/login_gapa'); // Adjust the path based on your routes
  }
};

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create_account', (req, res) => {
  res.render('signUp');
});

app.get('/login_gapa', (req, res) => {
  res.render('login');
});

app.get('/profile', requireLogin, async (req, res) => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('GAPA');
    const usersCollection = db.collection('users');

    // Fetch the user from the database based on their email
    const user = await usersCollection.findOne({ email: req.session.email });

    if (user) {
      // Fetch user experiences from MongoDB
      const userExperiences = user.experience || [];

      // Render the profile.ejs template with the user and experiences objects
      res.render('profile', { user, userExperiences });
    } else {
      console.log('User not found or not logged in');
      res.status(404).send('User not found or not logged in'); // or redirect to an error page
    }
  } catch (error) {
    console.error('Error handling /profile route:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});


app.post('/register', async (req, res) => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const {
      email,
      firstName,
      lastName,
      password,
      job,
      location,
      aboutMe,
      reachMe,
      experience,
    } = req.body;

    // Generate a random initialization vector (IV)
    const iv = randomBytes(16);

    // Encryption
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
    let encryptedPassword = cipher.update(password, 'utf-8', 'hex');
    encryptedPassword += cipher.final('hex');

    // Create a new User instance with the encrypted password and other details
    const newUser = new User({
      email,
      firstName,
      lastName,
      password: `${encryptedPassword}.${iv.toString('hex')}`,
      job: job || null, // Set to null if not provided
      location: location || null, // Set to null if not provided
      aboutMe: aboutMe || null, // Set to null if not provided
      reachMe: reachMe || null, // Set to null if not provided
      experience: experience || null, // Set to null if not provided
    });

    // Save the user to the database using MongoDB client
    const result = await client.db('GAPA').collection('users').insertOne(newUser);

    console.log('User registered successfully', result);
    res.redirect('/'); // Redirect to the home page or another page as needed
  } catch (error) {
    console.error('Error inserting user:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});


app.post('/login', async (req, res) => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('GAPA');
    const usersCollection = db.collection('users');

    const { email, password, captcha } = req.body;

    // Validate the captcha
    // if (captcha !== req.session.captcha) {
    //   console.log('Captcha validation failed');
    //   return res.redirect('/login_gapa'); // Redirect to the login page with an error message
    // }

    // Find the user with the provided email
    const user = await usersCollection.findOne({ email });

    if (user) {
      // Decrypt the stored password
      const [encryptedPassword, ivHex] = user.password.split('.');
      const iv = Buffer.from(ivHex, 'hex');

      const decipher = createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
      let decryptedPassword = decipher.update(encryptedPassword, 'hex', 'utf-8');
      decryptedPassword += decipher.final('utf-8');

      // Compare the provided password with the decrypted password
      if (decryptedPassword === password) {
        // Set session variables to track that the user is logged in
        req.session.isLoggedIn = true;
        req.session.email = user.email; // Assuming email is unique
        req.session.firstName = user.firstName;
        await req.session.save();
        console.log('User authenticated successfully:', user);
        res.redirect('/profile'); // Redirect to the desired page after successful login
      } else {
        console.log('Incorrect password');
        res.redirect('/login_gapa'); // Redirect to the login page with an error message
      }
    } else {
      console.log('User not found');
      res.redirect('/login_gapa'); // Redirect to the login page with an error message
    }
  } catch (error) {
    console.error('Error handling login:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});

// Assuming this code is inside an asynchronous function or an async route handler
async function handleEditRequest(req, res) {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('GAPA');
    const usersCollection = db.collection('users');

    const userEmail = req.body.email;
    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
      console.log('User not found');
      return res.status(404).send('User not found');
    }

    // Define the fields and their corresponding request keys
    const fields = [
      'job', 'location', 'about', 'gmail', 'phoneNumber', 'instagram', 'twitter'
    ];

    // Construct the update object
    const updateObject = {};

    // Iterate through fields
    fields.forEach(field => {
      const value = req.body[field];
      updateObject[field] = (value !== null && value !== undefined && value !== '') ? value : user[field];
    });

    // Check if there are fields to update
    if (Object.keys(updateObject).length > 0) {
      // Update the user's fields in the retrieved document
      await usersCollection.updateOne({ email: userEmail }, { $set: updateObject });
    }

    // Redirect to the profile page after a successful update
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

app.post('/experience', async (req, res) => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const { email, position, company, startYear, endYear, description } = req.body;

    // Find the user by email
    const existingUser = await client.db('GAPA').collection('users').findOne({ email });

    if (!existingUser) {
      return res.status(404).send('User not found');
    }

    // Append the new experience to the existing ones
    const newExperience = {
      position,
      company,
      startYear,
      endYear,
      description,
    };
    // Append the new experiences to the existing ones
    existingUser.experience = existingUser.experience || [];
    existingUser.experience.push(newExperience);

    // Update the user in the database
    const result = await client.db('GAPA').collection('users').updateOne(
      { email },
      { $set: { experience: existingUser.experience } }
    );

    console.log('Experience added successfully', result);
    res.status(200).send('Experience added successfully');
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});

// Example usage in an Express route handler
app.post('/edit', handleEditRequest);

// Endpoint to generate and serve captcha
app.get('/captcha', (req, res) => {
  const captchaOptions = {
    size: 5,  // Set the total number of characters
    ignoreChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // Exclude uppercase letters
    charPreset: '0123456789abcdefghijklmnopqrstuvwxyz', // Use only lowercase letters
    noise: 5,
  };
  const captcha = svgCaptcha.create(captchaOptions);
  req.session.captcha = captcha.text; // Store captcha text in the session
  
  res.type('svg');
  res.status(200).send(captcha.data);
});

app.get("/people", (req, res) => {
  res.render("people.ejs", { currentPage: res.locals.currentPage });
});

app.get("/communities", (req, res) => {
  res.render("communities.ejs", { currentPage: res.locals.currentPage });
})

app.get("/create_post", (req, res) => {
  res.render("create_post.ejs", { currentPage: res.locals.currentPage });
})

app.get("/feed", (req, res) => {
  res.render("feed.ejs", { currentPage: res.locals.currentPage });
})

app.get("/user", (req, res) => {
  res.render("user_profile.ejs", { currentPage: res.locals.currentPage });
})

app.get("/bookmark", (req, res) => {
  res.render("bookmark.ejs");
})

app.get("/projects", (req, res) => {
  res.render("projects.ejs");
})

app.get("/notifications", (req, res) => {
  res.render("notifications.ejs");
})

app.get("/login_gapa", (req, res) => {
  res.render("login.ejs");
})

app.get("/create_gapa", (req, res) => {
  res.render("create_account.ejs");
})

app.get("/create_communities", (req, res) => {
  res.render("create_communities.ejs");
})

app.get("/chat", (req, res) => {
  res.render("chat.ejs");
})

app.get("/myProjects", (req, res) => {
  res.render("myProjects.ejs");
})

app.get('/collections', async (req, res) => {
  try {
    const collections = await client.db().listCollections().toArray();
    const collectionNames = collections.map((collection) => collection.name);
    res.render('collections', { collections: collectionNames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/collections/:collectionName', async (req, res) => {
  const collectionName = req.params.collectionName;

  try {
      const collection = client.db().collection(collectionName);
      const documents = await collection.find({}).toArray();

      res.render('collections', { collectionName, documents });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

const router = express.Router();


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
