import { Request, Router , Response} from "express";
import { getConnection } from "typeorm";
import Club from "../entities/Club";
import Comment from "../entities/Comment";
import Post from "../entities/Post";
import User from "../entities/User";
import Vote from "../entities/vote";
import auth from "../middleware/auth";
import user from "../middleware/user";

const vote = async (req:Request,res:Response) => {
    const {identifier,slug,commentIdentifier,value} = req.body

    //Validate vote value
    if(![-1,0,1].includes(value)){
        return res.status(400).json({ value: 'Value must be -1,0,1'})
    }
    try {
        const user: User = res.locals.user
        let post = await Post.findOneOrFail({identifier,slug})
        let vote : Vote | undefined
        let comment : Comment | undefined

        if(commentIdentifier){
            //IF there is a comment identifier find vote by comment
            comment = await Comment.findOneOrFail ( {identifier : commentIdentifier})
            vote = await Vote.findOne({user,comment})
        }else{
            //Else find vote by post 
            vote = await Vote.findOne({user,post})
        }

        if(!vote && value === 0){
            //if no vote and value = 0  return error
            return res.status(404).json({error: 'Vote not found'})
        } else if(!vote){
            //If no vote create it
            vote = new Vote({user,value})
            if(comment) vote.comment=comment
            else vote.post = post
            await vote.save()
        }else if (value === 0){
            //if vote exists and value =0 remove vote from db
            await vote.remove()
        }else if (vote.value !== value){
           //If vote and value has changed update vote
            vote.value = value
            await vote.save()
        }

        post = await Post.findOneOrFail({identifier,slug},{relations:['comments','comments.votes','club','votes']})

        post.setUserVote(user)
        post.comments.forEach(c=> c.setUserVote(user))

        return res.json(post)

    } catch (error) {
        return res.status(500).json({error: 'Something went wrong'})
    }
}

const topClubs = async (_:Request,res:Response) => {
    try {
        const imageUrlExp = `COALESCE('http://localhost:5000/images/' || c."imageURN",
          'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y') `
        const  clubs =  await getConnection()
          .createQueryBuilder()
          .select(`c.title,c.name,${imageUrlExp} as "imageUrl", count(p.id) as "postCount"`)
          .from(Club,'c')
          .leftJoin(Post,'p',`c.name = p."clubName"`)
          .groupBy('c.title,c.name,"imageUrl"')
          .orderBy(`"postCount"`,'DESC')
          .limit(5)
          .execute()

          return res.json(clubs)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error:"Something went wrong"})
    }
}


const router = Router()
router.post('/vote',user,auth,vote)
router.get('/top-clubs',topClubs)


export default router