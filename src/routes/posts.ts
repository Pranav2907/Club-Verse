import { Request, Response, Router } from "express";
import Club from "../entities/Club";
import Comment from "../entities/Comment";
import Post from "../entities/Post";

import auth from '../middleware/auth'
import user from "../middleware/user";

const createPost = async (req:Request, res:Response) => {
    const {title,body,club} = req.body

    const user = res.locals.user

    if(title.trim() === ''){
        return res.status(400).json({title:'Title must not be empty'})
    }

    try {
        //TODO : Find club
        const clubRecord = await Club.findOneOrFail({name:club})

        const post = new Post({title,body,user, club:clubRecord })
        await post.save()

        return res.json(post)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error:'Something went Wrong'})
    }
}
const getPosts = async (_:Request,res:Response) => {
    try {
        const posts = await Post.find({
            order:{createAt:'DESC'},
            relations : ['comments','votes','club'],
        })

        if(res.locals.user){
            posts.forEach((p )=>p.setUserVote(res.locals.user))
        }

      return res.json(posts)  
    } catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
}

const getPost = async (req:Request,res:Response) => {
     const {identifier, slug} = req.params

    try {
        const post = await Post.findOneOrFail({identifier,slug},{
            relations:['club','comments']
        })

      return res.json(post)  
    } catch (err) {
        console.log(err)
        return res.status(404).json({error:"Post not found"})
    }
}

const commentOnPost = async (req:Request, res: Response) => {
    const {identifier,slug} = req.params
    const body = req.body.body

    try {
      const post = await Post.findOneOrFail({identifier,slug})
      
      const comment = new Comment({
          body,
          user: res.locals.user,
          post,
      })

      await comment.save()
      return res.json(comment)
    } catch (error) {
        console.log(error)
        return res.status(404).json({error: "Post not Found"})
    }
}

const router = Router()

router.post('/',user,auth,createPost)
router.get('/',user,getPosts)
router.get('/:identifier/:slug',getPost)
router.post('/:identifier/:slug/comments',user,auth,commentOnPost)


export default router
