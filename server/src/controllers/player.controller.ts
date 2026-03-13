import { Request, Response } from "express";
import { AuthRequest } from '../middleware/auth.middleware';
import Players from '../model/players.model'
import Team from "../model/team.model";


export const createPlayer = async(req : AuthRequest, res: Response) =>{
   try{

     const {playername, role, tags,teamId} = req.body;
     const  createdBy  = req.user?.id;    

     if(!playername || !role ||!tags ){
           return res.status(400).json({message: "playername, role, and teamId are required."})
       }

       if(!createdBy) {
            return res.status(401).json({message: "Unauthorized"});
        }

     const player = new Players({
          playername,
          role,
          tags,
          teamId,
          createdBy,
      })

     await player.save();
      res.json({message: "player created successfully..", player})
   
     }catch(error){
         res.status(500).json({ message: 'Server error.', error });
     }
}

export const getAllPlayer = async (req : AuthRequest, res: Response) => {
    try{
        const createdBy = req.user?.id;
        if(!createdBy) {
            return res.status(401).json({message: "Unauthorized"});
        }
        
        const players = await Players.find({ createdBy }).populate('teamId', 'teamname').populate('createdBy', 'username email');
        res.status(200).json(players);
    }catch(error){
        res.status(500).json({ message: 'Server error', error });
    }
}

export const deletePlayer = async (req: Request, res:Response) => {
    try{
        const {id} = req.params;
        
        await Players.findByIdAndDelete(id);
        res.status(200).json({message: "player deleted."});
    }catch(error){
        res.status(500).json({ message: 'Server error', error });
    }
}



export const updatePlayer = async (req : Request, res: Response) => {
    try {
        const {id} = req.params;
        const {playername, role, tags, teamId } = req.body;

        const player = await Players.findByIdAndUpdate(
            id,
            {playername, role, tags, teamId },
            {new: true, runValidators: true}
        );

        if(!player){
            return res.status(404).json({message: "player not found....."});
        }

        return res.status(200).json({message: "player updated.", player});
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}



export const getPlayersByTeam = async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId;

    const players = await Players.find({ teamId });

    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};