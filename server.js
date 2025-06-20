import express from 'express';
import cors from 'cors';    

const app = express();
const port = 3000;

// Use the cors middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from the 'public' directory
app.use(express.static('public'));
app.get('/', (req, res) => {
    console.log('Received request for root path');
    res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on website at http://localhost:${port}`);
});