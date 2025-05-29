import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const credentials = JSON.parse(
  fs.readFileSync('./credentials.json')
);

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

let db;


async function connectToDB() {
  const uri = !process.env.MONGODB_USERNAME 
  ? 'mongodb://127.0.0.1:27017'
  : `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@full-stack-react-server.ukvlefk.mongodb.net/?retryWrites=true&w=majority&appName=full-stack-react-server`;
  
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  db = client.db('full-stack-react-db');
}

app.use(express.static(path.join(__dirname, '../dist')));

app.get(/^(?!\/api).+/, (req, res) => {
		res.sendFile(path.join(__dirname, '../dist/index.html'));
})

async function authMiddleware(req, res, next) {
  const { authtoken } = req.headers;

  if (!authtoken) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const user = await admin.auth().verifyIdToken(authtoken);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

app.get('/api/articles/:name', async (req, res) => {
  const { name } = req.params;
  const article = await db.collection('articles').findOne({ name });
  res.json(article);
});

app.post('/api/articles/:name/upvote', authMiddleware, async (req, res) => {
  const { name } = req.params;

  const updatedArticle = await db.collection('articles').findOneAndUpdate(
    { name },
    { $inc: { upvotes: 1 } },
    { returnDocument: 'after' }
  );

  res.json(updatedArticle.value);
});


app.post('/api/articles/:name/comments', authMiddleware, async (req, res) => {
  const { name } = req.params;
  const { postedBy, text } = req.body;
  const newComment = { postedBy, text };

  const updatedArticle = await db.collection('articles').findOneAndUpdate(
    { name },
    {
      $push: { comments: newComment }
    },
    { returnDocument: 'after' }
  );

  res.json(updatedArticle.value);
});

app.get('/hello', (req, res) => {
  res.send('Hello from the backend!');
});

const PORT = process.env.PORT || 8000;  

async function start() {
  await connectToDB();
  app.listen(PORT, function() {
    console.log('Server is listening on port ' + PORT);
  });
}

start();
