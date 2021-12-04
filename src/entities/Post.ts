import {Entity as TOEntity ,Column, Index,  BeforeInsert, ManyToOne, JoinColumn, OneToMany} from "typeorm";

import Entity from './Entity'
import User from "./User";
import { makeId, slugify } from "../utils/helpers";
import Club from "./Club";
import Comment from "./Comment";
import Vote from "./vote";
import { Exclude, Expose } from "class-transformer";

@TOEntity("posts")
export default class Post extends Entity {

    constructor(post: Partial<Post>){
        super()
       Object.assign(this, post) 
    }
   

    @Index()
    @Column()
    identifier: string // 7 cHaracter Id

    @Column()
    title:string

    @Index()
    @Column()
    slug:string

    @Column({nullable:true,type:'text'})
    body:string

    @Column()
    clubName: string
    
    @Column()
    username:string

    @ManyToOne(() => User,(user) => user.posts)
    @JoinColumn({name:'username',referencedColumnName:'username'})
    user:User

    @ManyToOne(() => Club, (club) => club.posts)
    @JoinColumn({name:'clubName',referencedColumnName:'name'})
    club:Club
    
    
    @Exclude()
    @OneToMany(()=> Comment, comment =>comment.post)
    comments: Comment[]

    @Exclude()
    @OneToMany(() => Vote , vote => vote.post)
    votes:Vote[]

    @Expose() get url() : string {
        return  `/r/${this.clubName}/${this.identifier}/${this.slug}`
    }
    
   /* protected url : string
    @AfterLoad()
    createFields(){
        this.url = `/r/${this.clubName}/${this.identifier}/${this.slug}`
    }*/

    @Expose() get commentCount(): number {
        return this.comments?.length
    }

    @Expose() get voteScore() : number {
        return this.votes?.reduce((prev,curr) => prev + (curr.value || 0),0)
    }

    protected userVote:number
    setUserVote(user:User) {
        const index = this.votes?.findIndex(v => v.username === user.username)
        this.userVote = index > -1 ? this.votes[index].value : 0
    }

    @BeforeInsert()
    makeIdandSlug(){
        this.identifier = makeId(7)
        this.slug = slugify(this.title)
    }
}
