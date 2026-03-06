import {Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Team from "../model/team.model";


export const createTeam = async (req: AuthRequest, res: Response) => {
    try{

        const { teamname } = req.body;
        const createdBy = req.user?.id;

        if(!teamname) {
            return res.status(400).json({message: "team name is required.........."});
        }

        if(!createdBy) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const team = new Team({
            teamname,
            createdBy
        })

        await team.save();
        res.status(200).json({message: "team created.", team})

    }catch(error){
        res.status(500).json({ message: 'Server error', error });
    }
}

export const getAllTeams = async (req: Request, res: Response) => {
    try{
        const teams = await Team.find().populate('createdBy', 'username email');
        res.status(200).json(teams);
    }catch(error){
        res.status(500).json({ message: 'Server error', error });
    }
}

export const deleteTeam = async (req: AuthRequest, res:Response) => {
    try{
        const {id} = req.params;
        const userId = req.user?.id;

        if(!userId) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const team = await Team.findById(id);

        if(!team) {
            return res.status(404).json({message: "Team not found....."});
        }

        if(team.createdBy.toString() !== userId) {
            return res.status(403).json({message: "You can only delete your own teams.."});
        }

        await Team.findByIdAndDelete(id);
        res.status(200).json({message: "team deleted"});
    }catch(error){
       res.status(500).json({ message: 'Server error', error });
     }
 }

