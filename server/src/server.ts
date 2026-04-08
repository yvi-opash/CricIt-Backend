import express from 'express';
import cors from 'cors';
import {Server} from 'socket.io';
import http from 'http';
import { mongoDB } from './db';
import userRoutes from './routes/users.routes';
import teamRoutes from './routes/team.routes';   
import playerRoutes from './routes/player.routes';
import matchRoutes from './routes/match.routes';
import inningRoutes from './routes/inning.routes';
import ballRoutes from './routes/ball.routes';
// import PlayerStats from './routes/PlayerStats.routes';

const app = express();
app.use(express.json());
app.use(cors());

mongoDB();

app.get('/', (req : any, res : any) => {
    res.json({message: "Welcome to CricIt API"})
})

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});





app.use('/api/users', userRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/inning',inningRoutes);
app.use('/api/ball', ballRoutes);
// app.use('/api/player-stats', PlayerStats);

const PORT = process.env.PORT || 7000

server.listen(PORT, () => {
    console.log(`Server is running as on port ${PORT}`)
});


export { io };


io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("joinInning", (inningId) => {
    socket.join(inningId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});