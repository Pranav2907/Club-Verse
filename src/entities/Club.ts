import {Entity as TOEntity ,Column, Index, ManyToOne, JoinColumn, OneToMany} from "typeorm";


import Entity from './Entity'
import User from "./User";
import Post from "./Post";
import { Expose } from "class-transformer";

@TOEntity("clubs")
export default class Club extends Entity {

    constructor(club: Partial<Club>){
        super()
       Object.assign(this, club) 
    }
    
    
    @Index()
    @Column({unique:true})
    name : string

    @Column()
    title : string

    @Column({type :'text',nullable:true})
    description : string
    
    @Column({nullable:true})
    imageURN: string 

    @Column({nullable:true})
    bannerURN:string 
     
    @Column()
    username:string

    @ManyToOne(() => User)
    @JoinColumn({name:'username',referencedColumnName:'username'})
    user:User
    
    @OneToMany(() => Post,post => post.club)
    posts:Post[]


    @Expose()
    get imageUrl() : string{
        return this.imageURN ? `${process.env.APP_URL}/images/${this.imageURN}`
        : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    }

     @Expose()
    get bannerUrl() : string | undefined{
        return this.bannerURN ? `${process.env.APP_URL}/images/${this.bannerURN}`
        : undefined
    }


}
