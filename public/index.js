
//TO DO LIST
//头像
//
(function (){
  var socket = io.connect("localhost:8888");
  var connection = false;
  //存储当前用户姓名
  //存储好友
  var username = '';
  var friends = {};
  //存储用户消息
  var friendsMessage = {};
  var userInput  = document.getElementById("userInput");
  var title = document.getElementById("title");
  var friendList = document.getElementById("friendList");
  var charRoom = document.getElementById("charRoom");
  var chatRoomWrap = document.getElementById("chatRoomWrap");
  var chatFace = document.getElementById("chatFace");
  var faceTool = document.getElementById("face");
  var phoneTool = document.getElementById("phone");
  var send = document.getElementById("send");
  var scanner = document.getElementById("scanner");
  var cacheMessage = document.getElementById("cacheMessage");
  var localVideo = document.getElementById('local');
  var remoteVideo = document.getElementById('remote');
  var voice = document.getElementById('voice');
  var audioRequestPanel = document.getElementById('audioRequestPanel');
  var audioRequestName = document.getElementById('audioRequestName');
  var acceptAudioBtn = document.getElementById('acceptAudioBtn');
  var refuseAudioBtn = document.getElementById('refuseAudioBtn');
  //存储当前选中的好友姓名
  var receiver = '';
  var faceToolShow = false;
  var rex = /(?:<div class="aui-chat-arrow"><\/div>)([/\s/\S]*)(?:<\/div><\/div><\/div>)/;
  var constraints = {};
  var voiceConstraints = { audio: true , video: false };
  var videoConstraints = { audio: true , video: true };
  var offerOption = { 'offerToReceiveAudio': true , 'offerToReceiveVideo': true};
  var messageData = {};
  var audioData = {};
  var getUserMedia = (navigator.getUserMedia
    || navigator.webkitGetUserMedia
    || navigator.mediaDevices.getUserMedia
    || navigator.mozGetUserMedia
    || navigator.msGetUserMedia);
    var PeerConnection = (window.RTCPeerConnection
      || window.webkitPeerConnection00
      || window.webkitRTCPeerConnection
      || window.mozRTCPeerConnection);
      constraints.phone = voiceConstraints;
      constraints.video = videoConstraints;
      init();

      function init (){
        btnBind();
        socketOn();

        //浏览器关闭或页面刷新时都会触发此事件,发送close事件通知服务器此用户退出
        window.onunload = function () {
          if(username !== '')  socket.emit("close",username);
        }

        if(navigator.userAgent.indexOf("Firefox") > -1){
            window.onbeforeunload = window.onunload;
        }



      }

      function socketOn(){
        socket.on('join',join);
        socket.on('message',receiveMessage);
        socket.on('close',userOut);
        socket.on('audioRequest',function(data){
          var pc = audioData[data.sendUser].pc = new PeerConnection();
          console.log(data);
          audioData[data.sendUser].err = data.err;
          audioData[data.sendUser].typeEN = data.typeEN;
          audioData[data.sendUser].sdp = data.sdp;
          initAudioPanel(data.sendUser,'answerRequest',data.type);
        });
        socket.on('acceptAudio',function(data){
          console.log(data);
          acceptAudio(data.sendUser,audioData[data.sendUser].pc,data.sdp,data.typeEN);
        });
        socket.on('candidate',function(data){
          console.log('获取到网络候选')
          console.log(data);
          audioData[data.sendUser].pc.addIceCandidate(data.candidate);
        })
        socket.on('cancelAudio',function(data){
          console.log('对方取消了音视频聊天')
          createTips(chatRoomWrap,'用户:' + data + '取消了本次音视频聊天',2000);
          initAudioPanel(data);
        });
        socket.on('noAudioBoth',function(data){
          console.log(data);
          initAudioPanel(data);
          createTips(chatRoomWrap,'无法获取用户:' + data + '和您的设备',2000);
        })

      }


      //添加新用户
      function getUsers (friendName){
        var friendPanel = document.createElement("div");
        var friendAvatar = document.createElement("div");
        var friendMessageCount =document.createElement("div");
        var img = document.createElement("img");
        var friendWrap = document.createElement("div");
        var friendNickname = document.createElement("h3");
        var friendCurrentMessage = document.createElement("p");

        friendPanel.className = "friend-panel";
        friendAvatar.className = "friend-avatar";
        friendMessageCount.className = "friend-message-count";
        friendWrap.className = "friend-text-wrap";
        friendNickname.className = "friend-nickname aui-ellipsis-1";
        friendCurrentMessage.className = "friend-message aui-ellipsis-1 aui-text-info";
        img.src = "http://localhost:8888/source/1.jpg";

        friendList.appendChild(friendPanel);
        friendPanel.appendChild(friendAvatar);
        friendAvatar.appendChild(friendMessageCount);
        friendAvatar.appendChild(img);
        friendWrap.appendChild(friendNickname);
        friendWrap.appendChild(friendCurrentMessage);
        friendPanel.appendChild(friendWrap);

        setTimeout(function(){
          friendPanel.style.opacity = 1;
        },500);
        friendPanel.id = friendName;
        friendNickname.innerText = friendName;
        friendMessageCount.innerText = 0;
        //好友头像,姓名,当前消息的容器
        friends[friendName].panel = friendPanel;
        //未查看消息的条数
        friends[friendName].messageCount = friendMessageCount;
        //好友发送的最新消息
        friends[friendName].currentMessage = friendCurrentMessage;
        //储存聊天记录
        friends[friendName].message = '';

        //用来开启语音或视频聊天所用
        audioData[friendName] = {};
        audioData[friendName].sendUser = username;
        audioData[friendName].receiverUser = friendName;
        audioData[friendName].pc = null;
        //存储是否与好友处于语音或视频聊天状态
        audioData[friendName].voiceStatus = false;
        audioData[friendName].videoStatus = false;
        audioData[friendName].requesting = false;
        audioData[friendName].type = '';
        audioData[friendName].typeEN = '';
        audioData[friendName].sdp = null;
        audioData[friendName].candidate = null;
        audioData[friendName].track = [];
        audioData[friendName].err = null;

        friendPanel.onclick = function (){
          receiver = friendName;
          //初始化所有好友容器背景颜色
          for(var name in friends){
            friends[name].panel.style.backgroundColor = "white";
          }

          chatRoom.innerHTML = friends[receiver].message;
          //更改当前点击的好友容器的背景颜色,用以提示
          friendPanel.style.backgroundColor = "skyblue";
          //初始化未接受消息数,并将其隐藏
          friendMessageCount.innerText = 0;
          friendMessageCount.style.opacity = 0;
          title.innerText = "正在与" + friendName + "聊天中";
          chatRoomWrap.scrollTop = chatRoomWrap.scrollHeight;
        }

      }



      function audioRequest (){

        var reqObj = audioData[receiver];
        if(reqObj.requesting){
          createTips(chatRoomWrap,'无法重复请求',2000);
          return;
        }
        if(this.id === 'phone'){
          reqObj.type = '语音';
        } else {
          reqObj.type = '视频';
        }
        if(reqObj.voiceStatus || reqObj.videoStatus){
          createTips(chatRoomWrap,'您与' + reqObj.receiverUser + '已建立' + reqObj.type + '连接',2000);
          return;
        }

        reqObj.typeEN = this.id;
        reqObj.pc = new PeerConnection();
        getMedia(reqObj.receiverUser,reqObj.pc,reqObj.typeEN);
        initAudioPanel(receiver,'request',reqObj.type);
        reqObj.pc.createOffer(function(offer){
          reqObj.sdp = offer;
          reqObj.pc.setLocalDescription(new RTCSessionDescription(offer));
          console.log('发送请求');
          socket.emit('audioRequest',reqObj);
        },function(err){
          console.log(err);
        });
        reqObj.requesting = true;

      }

      //同意音视频聊天
      //user为请求者的用户名
      //pc为点对点连接
      //type表示聊天的类型为语音还是视频
      //sdp为请求者的offer信息
      //err为请求者无法获取设备的错误信息,若果有此项参数传入,则代表无法获取请求者的设备
      function acceptAudio(user,pc,sdp,typeEN,err){
        console.log('同意了音视频聊天');
        console.log(sdp);
        pc.setRemoteDescription(new RTCSessionDescription(sdp));
        pc.onicecandidate = function(event){
          if(event.candidate){
            console.log('传输网络候选')
            audioData[user].candidate = event.candidate;
            socket.emit('candidate',audioData[user]);
          }
        }
        //双方都获取对方的sdp协议信息和网络候选icecandidate后,就可以在ontrack中获取到对方的音视频流
        pc.ontrack = function(event){
          console.log('远程视频流');
          localVideo.srcObject = event.streams[0];
        }
        if(typeEN === 'phone'){
          audioData[user].type = '语音';
          audioData[user].voiceStatus = true;
        }else{
          audioData[user].type = '视频';
          audioData[user].videoStatus = true;
        }
      initAudioPanel(user,'chating',audioData[user].type,err);

      }

      //获取用户设备
      //user为获取设备失败后要发送信息的对象
      //pc为点对点的连接
      //type为类型,表示是语音聊天还是视频聊天
      //err为获取设备失败后的参数,如果有传入这项参数,则代表获取对方的设备失败
      function getMedia(user,pc,typeEN,err){

        pc.createDataChannel('noaudio');
        console.log('获取设备');
        //获取摄像头或麦克风,如果无法检测到设备,就得创建消息通道,才可以发送请求
        if(getUserMedia === navigator.mediaDevices.getUserMedia){

          navigator.mediaDevices.getUserMedia(constraints[typeEN]).then(function(stream){
            stream.getTracks().forEach(function(track){
              console.log('添加流');
              pc.addTrack(track,stream);
            });
          }).catch(function(error){
            audioData[user].err = error;
            if(err){
                socket.emit('noAudioBoth',audioData[user]);
                  console.log(user);
              initAudioPanel(user);
              createTips(chatRoomWrap,'双方都没有音视频,无法进行通话',2000);
            }
            console.log(error);
          })

        }else{

          getUserMedia.call(navigator,constraints[typeEN],function(stream){
            stream.getTracks().forEach(function(track){
              pc.addTrack(track,stream);
            });
          },function(error){
            audioData[user].err = error;
            if(err){
              socket.emit('noAudioBoth',audioData[user]);
              console.log(user);
              initAudioPanel(user);
              createTips(chatRoomWrap,'双方都没有音视频,无法进行通话',2000);
            }
            console.log(error);
          });

        }

      }

      //初始化音视频聊天框
      //user为发起请求的用户名,或正在音视频聊天的用户名
      //status,音视频聊天框的状态,有chating正在音视频聊天中,request正在请求中,answerRequest回应请求
      //无参数时隐藏聊天音视频聊天框
      function initAudioPanel(user,status,type,err){
        var panelOpacity = 1;
        var acceptAudioBtnOpacity = 1;
        var refuseAudioBtnOpacity = 1;
        var requestText = '';
        var acceptBtnText = '';
        var refuseBtnText = '';

        if(status === 'chating'){

          requestText = '你正在与' + user + type + '聊天中';
          if(err){
            requestText += ',无法检测到对方的设备,所以您可能听不到对方的声音';
          }
          acceptAudioBtnOpacity = 0;
          refuseBtnText = '断开';
          acceptAudioBtn.onclick = null;
          refuseAudioBtn.onclick = function(){
            initAudioPanel(user);
            socket.emit('cancelAudio',audioData[user]);
          }
          audioData[user].requesting = false;

        }

        else if(status === 'request'){

          requestText = '你正在向' + user + '请求' + type + '聊天';
          acceptAudioBtnOpacity = 0;
          refuseBtnText = '取消'
          acceptAudioBtn.onclick = null;
          refuseAudioBtn.onclick = function(){
            initAudioPanel(user);
            socket.emit('cancelAudio',audioData[user]);
          }

        }

        else if(status === 'answerRequest'){

          requestText = '用户:' + user + ',正在向您请求' + type + '聊天';
          acceptBtnText = '接受';
          refuseBtnText = '拒绝';

          acceptAudioBtn.onclick = function(){
            var pc = audioData[user].pc;
            console.log(audioData[user].err);
            getMedia(user,audioData[user].pc,audioData[user].typeEN);
            acceptAudio(user,pc,audioData[user].sdp,audioData[user].typeEN,audioData[user].err);
            pc.createAnswer(function(sdp){
              audioData[user].sdp = sdp;
              console.log('回应请求');
              pc.setLocalDescription(new RTCSessionDescription(sdp));
              socket.emit('acceptAudio',audioData[user]);
            },function(error){
              console.log(error);
            })
          };
          refuseAudioBtn.onclick = function(){
            initAudioPanel(user);
            socket.emit('cancelAudio',audioData[user]);
          };

        }

        else{

          panelOpacity = 0;
          acceptAudioBtnOpacity = 0;
          refuseAudioBtnOpacity = 0;
          acceptAudioBtn.onclick = null;
          refuseAudioBtn.onclick = null;
          closeAudio(user);

        }

        audioRequestPanel.style.opacity = panelOpacity;
        acceptAudioBtn.style.opacity = acceptAudioBtnOpacity;
        refuseAudioBtn.style.opacity =refuseAudioBtnOpacity;
        audioRequestName.innerText = requestText;
        acceptAudioBtn.innerText = acceptBtnText;
        refuseAudioBtn.innerText = refuseBtnText;

      }

      function closeAudio(user){
        console.log('关闭audio:' + user);
        audioData[user].pc = null;
        audioData[user].sdp = null;
        audioData[user].candidate = null;
        audioData[user].requesting = false;
        audioData[user].voiceStatus = false;
        audioData[user].videoStatus = false;
        audioData[user].type = '';
        audioData[user].typeEN = '';
      }

      function sendMessage (){

        //只输入空格则不发送消息
        if(scanner.innerHTML.trim() === '' && scanner.innerText.trim() === ''){
          scanner.innerHTML = '';
          return;
        }

        var date = new Date();

        chatRoom.innerHTML
        += "<div class='aui-chat-item aui-chat-right'>"
        +     "<div class='aui-chat-media'>"
        +         "<img src='http://localhost:8888/source/1.jpg'>"
        +     "</div>"
        +     "<div class='aui-chat-inner'>"
        +         "<div class='aui-chat-name'>" + username
        +             "<span class='aui-label aui-label-warning'>" + date.toLocaleTimeString() + "</span>"
        +         "</div>"
        +         "<div class='aui-chat-content'>"
        +             "<div class='aui-chat-arrow'></div>"
        +         scanner.innerHTML + "</div>"
        +     "</div>"
        +   "</div>"

        cacheMessage.innerHTML
        += "<div class='aui-chat-item aui-chat-left'>"
        +     "<div class='aui-chat-media'>"
        +         "<img src='http://localhost:8888/source/1.jpg'>"
        +     "</div>"
        +     "<div class='aui-chat-inner'>"
        +         "<div class='aui-chat-name'>" + username
        +             "<span class='aui-label aui-label-warning'>" + date.toLocaleTimeString() + "</span>"
        +         "</div>"
        +         "<div class='aui-chat-content'>"
        +             "<div class='aui-chat-arrow'></div>"
        +         scanner.innerHTML + "</div>"
        +     "</div>"
        +   "</div>"


        chatRoomWrap.scrollTop = chatRoomWrap.scrollHeight;
        messageData.receiverUser = receiver;
        messageData.message = cacheMessage.innerHTML;
        //@@中间内容表示自己的用户名,##中间表示的是接受者的用户名,将此内容发送给服务器
        //服务器会自动解析并发送给相应的接受者
        cacheMessage.innerHTML = '';
        socket.emit("message",messageData);
        scanner.focus();
        //添加聊天记录
        friends[receiver].message = chatRoom.innerHTML;
        if(scanner.innerHTML.length > 10){
          scanner.innerHTML = scanner.innerHTML.substring(0,10) + "...";
        }
        friends[receiver].currentMessage.innerHTML = scanner.innerHTML;
        scanner.innerHTML = '';

      }


      //接收聊天消息
      function receiveMessage (data){
        if(receiver === data.sendUser){
          chatRoom.innerHTML += data.message;
          chatRoomWrap.scrollTop = chatRoomWrap.scrollHeight;
          friends[data.sendUser].message = chatRoom.innerHTML;
        }else{
          friends[data.sendUser].messageCount.innerText ++;
          friends[data.sendUser].messageCount.style.opacity = 1;
          friends[data.sendUser].message += data.message;
        }
        var message = data.message.match(rex)[1];
        message = message.replace(/<img src=[/\s/\S]*>/,"(emoji)");
        message = htmldecode(message);
        if(message.length > 10){
          message = message.substring(0,10) + "...";
        }
        friends[data.sendUser].currentMessage.innerText = message;
      }

      //用户退出
      function userOut (name){
        if(connection){
          console.log(name);
          console.log(audioData[name]);
          if(audioData[name].voiceStatus || audioData[name].videoStatus) initAudioPanel();
          var nodeValue = document.getElementById(name);
          setTimeout(function(){
            nodeValue.parentNode.removeChild(nodeValue);
            delete friends[name];
            delete audioData[name];
          },500);
         nodeValue.style.opacity = 0;
        }
      }



      function lastCursor (){
        scanner.focus();
        if($.support.msie){
          var range = document.selection.createRange();
          this.last = range;
          range.moveToElementText(scanner);
          range.select();
          document.selection.empty(); //取消选中
        } else {
          var range = document.createRange();
          range.selectNodeContents(scanner);
          range.collapse(false);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }


      //创建消息提示
      //node为父元素,消息提示框将为成为node的子元素
      //text为消息提示框的内容
      //timeout为消息提示框的显示时间
      function createTips(node,text,timeout){

        var tip = document.createElement('div');
        var iconInfo = document.createElement('i');
        var tipTitle = document.createElement('div');
        var iconClose = document.createElement('i');


        tip.className = 'aui-tips aui-margin-b-15';
        iconInfo.className = 'aui-iconfont aui-icon-info';
        tipTitle.className = 'aui-tips-title';
        iconClose.className = 'aui-iconfont aui-icon-close';

        tipTitle.innerText = text;
        iconClose.onclick = function(){
          clearTimeout(close);
          node.removeChild(tip);
        }

        tip.appendChild(iconInfo);
        tip.appendChild(tipTitle);
        tip.appendChild(iconClose);
        node.appendChild(tip);

        var close = setTimeout(function(){
          node.removeChild(tip);
        },timeout);

      }

      //获取表情包
      function getFace (data){
        //获取表情包的图片名字,然后用http去请求表情包
        for(var i=0;i<data.length;i++){
          var face = document.createElement("img");
          face.src = "http://localhost:8888/face/"+data[i];
          face.onclick = function (event) {
            var e = event || window.event;
            scanner.innerHTML += "<img src='" + this.src + "'>";
            faceToolShow = false;
            chatFace.style.visibility = "hidden";
            lastCursor();
            e.returnValue = false;
            e.preventDefault();
          }
          chatFace.appendChild(face);
        }

      }

      function btnBind(){
        userInput.children[1].onkeypress = function(event){
          var e = event || window.event;
          if(e && e.keyCode == 13){
            socket.emit('join',this.value);
          }
        }

        faceTool.onclick = function(){
          if(!faceToolShow){
            faceToolShow = true;
            chatFace.style.visibility = "visible";
          }else{
            faceToolShow = false;
            chatFace.style.visibility = "hidden";
          }
        }

        scanner.onkeydown = function(event){
          var e = event || window.event;
          if(e.keyCode == 13){
            sendMessage();
            e.returnValue = false;
            e.preventDefault();
          }
        };

        send.onclick = sendMessage;
        phoneTool.onclick = audioRequest;

      }


            //验证通过
            function join (data){

              if(data === 'haveUser'){
                userInput.children[0].innerText = "此用户已存在";
                return;
              }

              if(data.faceList){
                connection = true;
                username = data.name;
                messageData.sendUser = data.name;
                audioData.sendUser = data.name;
                title.innerText = username;
                userInput.style.opacity = 0;
                userInput.style.visibility = "hidden";

                setTimeout(function(){
                  userInput.children[1].style.display = "none";
                },1000);
                getFace(data.faceList);
                for(var i=0;i<data.allUserName.length;i++){
                  if(data.allUserName[i] !== username){
                    friends[data.allUserName[i]] = {};
                    getUsers(data.allUserName[i]);
                  }
                }
                return;
              }
              //connection用来防止在用户输入名字前获取到其他用户的登录信息.
              //只有输入完名字并进入聊天室时才可以添加用户
              if(connection){
                friends[data.name] = {};
                getUsers(data.name);
              }

            }


      function htmldecode(str){
        var div = document.createElement('div');
        div.innerHTML = str;
        return div.innerText || div.textContent;
      }

    })();
