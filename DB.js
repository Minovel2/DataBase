import {world, Player, system} from "@minecraft/server"
let all = [], objNames = [];
let iterNum = 0;
let pastDate = Date.now();

export class DB {
    static maxIteration = 1000;
    static content = {};
    static isLoaded = false;
    
    constructor(name) {
        let newName = "_DB_" + name;
        this.name = newName;
        if (!world.scoreboard.getObjective(newName)) {
            world.scoreboard.addObjective(newName,newName);
        }
        
        if (!DB.content[newName]) {
            DB.content[newName] = new Map();
        }
    }
    
    set(key,value) {
        let obj = world.scoreboard.getObjective(this.name);
        let json = JSON.stringify({
            key: key,
            value: DB.content[this.name].get(key)
        });
        if (obj.hasParticipant(json)) {
            obj.removeParticipant(json);
        }
        obj.setScore(JSON.stringify({
            key: key,
            value: value
        }),0);
        DB.content[this.name].set(key, value);
    }
    
    get(key) {
        return DB.content[this.name].get(key);
    }
    
    has(key) {
        return DB.content[this.name].has(key);
    }
    
    keys() {
        return DB.content[this.name].keys();
    }
    
    values() {
        return DB.content[this.name].values();
    }
    
    collection() {
        return DB.content[this.name];
    }
    
    delete(key) {
        world.scoreboard.getObjective(this.name).removeParticipant(JSON.stringify({
            key: key,
            value: DB.content[this.name].get(key)
        }));
        DB.content[this.name].delete(key);
    }
    
    clear() {
        DB.content[this.name].clear();
        world.scoreboard.removeObjective(this.name);
        world.scoreboard.addObjective(this.name,this.name);
    }
    
    size() {
        return DB.content[this.name].size;
    }
}

DB.delete = function(DBName) {
    let newName = "_DB_" + DBName;
    world.scoreboard.removeObjective(newName);
    delete DB.content[newName];
}


export class NBT_DB {
    constructor(name) {
        let newName = "_NBTDB_" + name;
        this.name = newName;
        if (!world.scoreboard.getObjective(newName)) {
            world.scoreboard.addObjective(newName,newName);
        }
    }
    
    set(key,value) {
        let obj = world.scoreboard.getObjective(this.name);
        let json = JSON.stringify({
            key: key,
            value: this.get(key)
        });
        if (obj.hasParticipant(json)) {
            obj.removeParticipant(json);
        }
        obj.setScore(JSON.stringify({
            key: key,
            value: value
        }),0);
    }
    
    get(key) {
        for (let p of world.scoreboard.getObjective(this.name).getParticipants()) {
            if (JSON.parse(p.displayName).key == key) {
                return JSON.parse(p.displayName).value;
            }
        }
    }
    
    has(key) {
        return world.scoreboard.getObjective(this.name).hasParticipant(JSON.stringify({
            key: key,
            value: this.get(key)
        }));
    }
    
    keys() {
        let arr = [];
        for (let p of world.scoreboard.getObjective(this.name).getParticipants()) {
            arr.push(JSON.parse(p.displayName).key);
        }
        return arr;
    }
    
    values() {
        let arr = [];
        for (let p of world.scoreboard.getObjective(this.name).getParticipants()) {
            arr.push(JSON.parse(p.displayName).value);
        }
        return arr;
    }
    
    collection() {
        let arr = [];
        for (let p of world.scoreboard.getObjective(this.name).getParticipants()) {
            arr.push(JSON.parse(p.displayName));
        }
        return arr;
    }
    
    delete(key) {
        world.scoreboard.getObjective(this.name).removeParticipant(JSON.stringify({
            key: key,
            value: this.get(key)
        }));
    }
    
    clear() {
        world.scoreboard.removeObjective(this.name);
        world.scoreboard.addObjective(this.name,this.name);
    }
    
    size() {
        return world.scoreboard.getObjective(this.name).getParticipants().length
    }
}

NBT_DB.delete = function(DBName) {
    let newName = "_NBTDB_" + DBName;
    world.scoreboard.removeObjective(newName);
}


Player.prototype.setToDB = function(db, value) {
    db.set(this.name, value);
}

Player.prototype.getFromDB = function(db) {
    return db.get(this.name);
}

for (let obj of world.scoreboard.getObjectives()) {
    if (obj.displayName.startsWith("_DB_")) {
        if (!DB.content[obj.displayName]) {
            DB.content[obj.displayName] = new Map();
        }
        
        for (let par of obj.getParticipants()) {
        objNames.push(obj.displayName);
        all.push(par);
        }
    }
}


for (let i=iterNum;(i<iterNum+DB.maxIteration && i<all.length);i++) {
        let obj = JSON.parse(all[i].displayName);
        DB.content[objNames[i]].set(obj.key, obj.value);
    }
    iterNum += DB.maxIteration;


let interval = system.runInterval(() => {
    for (let i=iterNum;(i<iterNum+DB.maxIteration && i<all.length);i++) {
        let obj = JSON.parse(all[i].displayName);
        DB.content[objNames[i]]?.set(obj.key, obj.value);
    }
    iterNum += DB.maxIteration;
    
    if (iterNum >= all.length) {
        console.warn(`database loaded successfully, loaded in ${Date.now()-pastDate} ms`);
        DB.isLoaded = true;
        system.clearRun(interval);
    }
},0)
