import express from 'express';
import connectDB from './database-connection/db.connect.js';

const app = express();

// to make app understand json
app.use(express.json());

//TODO: enable CORS

// connect database
await connectDB();

// register routes

//TODO: handle global error

// network port and server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
