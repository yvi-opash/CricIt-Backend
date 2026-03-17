import express from 'express';
import cors from 'cors';
import { mongoDB } from './db';
import userRoutes from './routes/users.routes';
import teamRoutes from './routes/team.routes';   
import playerRoutes from './routes/player.routes';
import matchRoutes from './routes/match.routes';
import inningRoutes from './routes/inning.routes';
import ballRoutes from './routes/ball.routes';

const app = express();
app.use(express.json());
app.use(cors());

mongoDB();

app.get('/', (req : any, res : any) => {
    res.json({message: "Welcome to CricIt API"})
})

app.use('/api/users', userRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/inning',inningRoutes);
app.use('/api/ball', ballRoutes);

const PORT = process.env.PORT || 7000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});