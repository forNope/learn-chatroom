'use strict'
let express = require("express");
let app = express();
let server = require("http").Server(app);
let io = require("socket.io")(server);
let path = require("path");
let fs = require("fs");
let connections = {};
let allUserName = [];

  function start(){
    const port = 8888
    server.listen(port, '0.0.0.0');
    app.use(express.static(path.join(__dirname,'public')));
    phantomChatInit();
    console.log("服务器启动, 端口：" + port);

  }

  function phantomChatInit(){

    io.on('connection', (socket) => {

      socket.on('join', (data) => {
        if(connections[data]){
          socket.emit('join','haveUser');
          return;
        }
        allUserName.push(data);
        connections[data] = socket;
        fs.readdir(__dirname + "/public/face",(err,files) =>{
          var joinInit = {};
          joinInit.name = data;
          joinInit.allUserName = allUserName;
          socket.broadcast.emit('join',joinInit)
          joinInit.faceList = files;
          socket.emit('join',joinInit);
        })
      });

      socket.on('close', (data) => {
       delete connections[data];
       for(let i=0;i<allUserName.length;i++){
         if(allUserName[i] === data){
           allUserName.splice(i,1);
         }
       }
       socket.broadcast.emit('close',data);
     });

      socket.on('message',(data) => {
        connections[data.receiverUser].emit('message',data);
      });

      socket.on('audioRequest',(data) => {
         connections[data.receiverUser].emit('audioRequest',data);
      })

      socket.on('acceptAudio',(data) => {
        console.log('接受音视频聊天');
        console.log(data.receiverUser);
        connections[data.receiverUser].emit('acceptAudio',data);
      })

      socket.on('candidate',(data) => {
        console.log('传输网络候选')
        console.log(data.receiverUser)
        connections[data.receiverUser].emit('candidate',data);
      })

      socket.on('refuseAudio',(data) => {
        console.log('拒绝音视频聊天')
        console.log(data.receiverUser);
        connections[data.receiverUser].emit('refuseAudio',data);
      })

      socket.on('cancelAudio',(data) => {
        connections[data.receiverUser].emit('cancelAudio',data.sendUser);
      })

      socket.on('noAudioBoth',(data) => {
        console.log(data);
        connections[data.receiverUser].emit('noAudioBoth',data.sendUser);
      })

    });



  }

start();
