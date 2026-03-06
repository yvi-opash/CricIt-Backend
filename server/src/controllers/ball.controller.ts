import Match, { MatchStatus } from "../model/match.model";
import Inning from "../model/inning.model";
import Ball from "../model/ball.model";
import { Request, Response } from "express";


export const addBall = async(req: Request, res:Response) =>{
    try {
        
        const {matchId, Id} =req.params;
        const { runsScored = 0, extraRuns = 0, isWicket = false, extraType, wicketType, outPlayer, batsman, bowler } = req.body;

        const match = await Match.findById(matchId);
        if(!match) return res.status(404).json({message:"Match not found..."});
        if(match.status !== MatchStatus.LIVE) return res.status(400).json({message : "Match is not live!!!!!!!!!!!!"});

        const inning = await Inning.findById(Id);
        if(!inning) return res.status(404).json({message: "inning not found...."});
        if(inning.status == "completed")return res.status(400).json({message: "match is compleated...."});


        const overNumber = inning.oversCompleted;
        const ballNumber = inning.ballsInCurrentOver;


        const ball = await new Ball({
            matchId,
            inningsId: Id,
            batsman: batsman || inning.striker,
            bowler: bowler || inning.currentBowler,
            runsScored,
            extraType,
            wicketType,
            overNumber,
            ballNumber
        });



        inning.totalRuns += runsScored + extraRuns;



    } catch (error) {
        res.status(400).json({ message : "server error", error})
    }
}











































