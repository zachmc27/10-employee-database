import express from 'express';
import Cli from './classes/Cli.js'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());



app.use((_req, res) => {
    res.status(404).end();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});

