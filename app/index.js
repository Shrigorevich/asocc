const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io')
const {Pool} = require('pg')
const rp = require('request-promise');

const app = express();
const server = http.createServer(app)
const io = socketIO(server)
const port = 8000;


app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, function() {
    console.log('HTTP sever started on port 8000');
});
function Constructor(){
    return {
        videocard: null,
        processor: null,
        motherboard: null,
        add_module: function(obj){
            obj.code == 0 ? this.videocard = obj :
            obj.code == 1 ? this.processor = obj :
            this.motherboard = obj;
        },
        remove_module: function(code){
            code == 0 ? this.videocard = null :
            code == 1 ? this.processor = null :
            this.motherboard = null;
        }
    };
}

function sql_req(tableName, constructor){
    console.log('sql_req');
    if(tableName == "videocard"){
        return  `SELECT * FROM ${tableName}s WHERE mark<${constructor.processor.mark*1.2} ORDER BY mark DESC LIMIT 4`
    }else if(tableName == "processor"){
        return `SELECT * FROM ${tableName}s WHERE mark*1.2>${constructor.videocard.mark} ORDER BY mark ASC LIMIT 4`
    }else if(tableName == "motherboard"){
        
    }
}

function finder(tableName, constructor){
    console.log('finder');
    return new Promise((resolve, reject) => {
        const pool = new Pool({
           host: '127.0.0.1',
           port: 5432,
           database: 'modules',
           user: 'admin',
           password: '456385',
        })
        const sql = sql_req(tableName, constructor);
        pool.query(sql, (err, res) => {
            resolve(res.rows);
        });
        pool.end()
    })
}

io.on('connection', (socket) => {
    console.log('A new user just connected..');

    let constructor = new Constructor;
    let offset = 0;
    let buffer = null;
    let value = null;

    //DATA REQUEST\RESPONSE
    socket.on('dataRequest', function(data){

        data.queue == 'next' ? offset += 16 : offset = 0;

        if(data.sort == 'mark'){
            buffer = buffer.sort((a, b) => (b.mark - a.mark))
        }

        if (!buffer || value != data.value){
            value = data.value;
            const pool = new Pool({
               host: '127.0.0.1',
               port: 5432,
               database: 'modules',
               user: 'admin',
               password: '456385',
            })
            const sql =  `SELECT * FROM ${value};`;
            pool.query(sql, (err, res) => {
               buffer = res.rows;
               socket.emit('dataResponse', {data: buffer.slice(0 + offset, 16 + offset), tableName : value})
            });
            pool.end();
        }else{
            socket.emit('dataResponse', {data: buffer.slice(0 + offset, 16 + offset), tableName : value})
        }
    })

    socket.on('nameMatching', function(data){
        console.log(data.inputValue);
        const pool = new Pool({
           host: '127.0.0.1',
           port: 5432,
           database: 'modules',
           user: 'admin',
           password: '456385',
        })
        const sortingColumn = data.tableName == 'motherboards' ? 'speed' : 'mark'
        const sql =  `SELECT * FROM ${data.tableName} WHERE lower(name) LIKE lower('%${data.inputValue}%') ORDER BY ${sortingColumn} DESC ;`;
        pool.query(sql, (err, res) => {
           if(err){
               console.log(err);
           }else{
               buffer = res.rows
               socket.emit('dataResponse', {data: buffer.slice(0, 16), tableName: data.tableName})
               console.log(buffer.length);
           }
        });
        pool.end();
    })
    //DATA REQUEST\RESPONSE

    //CONSTRUCTOR REQUEST\RESPONSE
    socket.on('constructorRequest', function(data){
        if(typeof data == 'object'){
            constructor.add_module(data)
            console.log(constructor);
            socket.emit('constructorResponse', data)
        }else{
            constructor.remove_module(data)
            console.log(constructor);
        }
    })

    socket.on('finderRequest', function(elemToFind){
        console.log('finderRequest');
        if(!constructor[elemToFind]){
            finder(elemToFind, constructor).then((res) => {
                socket.emit('finderResponse', {data: res, tableName: `${elemToFind}s`})
            })
        }else{
            console.log('Already picked');
        }
    })
    //CONSTRUCTOR REQUEST\RESPONSE
})
