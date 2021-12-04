import { NextFunction, Request, Response, Router } from "express";
import { isEmpty } from "class-validator";
import { getRepository } from "typeorm";
import multer, { FileFilterCallback } from 'multer'
import path from "path";
import fs from 'fs'


import User from "../entities/User";
import auth from "../middleware/auth";
import user from "../middleware/user";
import Club from "../entities/Club";
import Post from "../entities/Post";
import { Subject } from "typeorm/persistence/Subject";
import { callbackify } from "util";
import { makeId } from "../utils/helpers";


const createClub = async (req:Request,res:Response) => {
    const {name,title,description} = req.body

    const user : User = res.locals.user

    try {
        let errors: any = {}
        if(isEmpty(name)) errors.name ='Name must not be empty'
        if(isEmpty(title)) errors.title ='Title must not be empty'

        const club = await getRepository(Club)
        .createQueryBuilder('club')
        .where('lower(club.name )= :name', {name : name.toLowerCase()})
        .getOne()

        if(club) errors.name = "Club exists already"

        if(Object.keys(errors).length>0){
           throw errors
        }


    } catch (error) {
        return res.status(400).json(error)
    }

    try {
        const club = new Club({name,description,title,user})
        await club.save()

       return res.json(club)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error:'Something went Wrong'})
    }
}

const getClub = async (req:Request,res:Response) => {
    const name = req.params.name

    try {
        const club = await Club.findOneOrFail({name})
        const posts = await Post.find({
            where:{club},
            order: {createAt : 'DESC'},
            relations:['comments','votes']
        })
        club.posts = posts

        if(res.locals.user){
           club.posts.forEach(p=>p.setUserVote(res.locals.user))
        }

        return res.json(club)
    } catch (error) {
        console.log(error)
        return res.status(404).json({club:'club not found'})
        
    }
}

const ownClub = async (req:Request,res:Response,next:NextFunction) => {
    const user: User = res.locals.user

    try {
        const club = await Club.findOneOrFail({where: {name: req.params.name}})

        if(club.username !== user.username){
            return res.status(403).json({error:'You dont own this club'})
        }
        res.locals.club = club
        return next()

    } catch (error) {
        return res.status(500).json({error:'something went wrong'})
    }
}

const upload = multer({
   storage:multer.diskStorage({
       destination:'public/images',
       filename: (_,file,callback) => {
           const name = makeId(15)
           callback(null,name + path.extname(file.originalname)) // e.g sfdvfdgdff + .png
       }
   }),
   fileFilter:(_,file :any ,callback : FileFilterCallback) => {
      if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
          callback(null,true)
      }else{
          callback(new Error ('Not an image'))
      }
   }
})

const uploadClubImage = async (req:Request,res:Response)=>{
      const club: Club = res.locals.club
    try {
        const type = req.body.type

        if(type!== 'image' && type !== 'banner'){
            fs.unlinkSync(req.file.path)
            return res.status(400).json({error:'Invalid type'})
        }
         
        let oldImageURN: string = ''
        if(type === 'image'){
             oldImageURN = club.imageURN || ''
            club.imageURN  = req.file.filename
           
        }else if ( type==='banner'){
            
            oldImageURN = club.imageURN || ''
            club.bannerURN = req.file.filename
            
        }
        await club.save()
         
        if(oldImageURN !== ''){
            fs.unlinkSync(`public\\images\\${oldImageURN}`)
        }

        return res.json(club)
    } catch (error) {
        console.log(error)
        return res.status(500).json({error:'something went wrong'})
}
    }
    


const router = Router()

router.post('/',user,auth,createClub)
router.get('/:name',user,getClub)
router.post('/:name/image',user,auth,ownClub,upload.single('file'),uploadClubImage)

export default router