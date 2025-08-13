export default class Message{
    constructor(fromId,name,sessionId,text,time){
        this.fromId=fromId;
        this.name=name;
        this.sessionId=sessionId;
        this.text=text;
        this.time=time;
    }
}