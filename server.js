#!/bin/env node

var self = {};
self.host = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
self.port = process.env.OPENSHIFT_NODEJS_PORT || 10001;

var WebSocketServer = require('uws').Server;
var qs = require('url');
var log = console.log;
var wss = new WebSocketServer(self);
var clients = {};

wss.on('connection', function connection(ws) {
  var queryParams = qs.parse(ws.upgradeReq.url, true).query;
  var sessionKey = queryParams['skey'];
  var isHost = false;
  var type = 'client'

  if(sessionKey && sessionKey.length == 40){
    if(!clients[sessionKey])
      clients[sessionKey] = {}
    else
      endConn(clients[sessionKey].client);
    clients[sessionKey].client = ws;
  }
  else if(sessionKey && sessionKey.length == 80){
    var key = sessionKey.substring(0, 40);
    var secret = sessionKey.substring(40, 80);
    if(key == SHA1(secret)){
      type = 'host';
      isHost = true;
      sessionKey = key;
      if(!clients[sessionKey])
        clients[sessionKey] = {}
      else
        endConn(clients[sessionKey].host);
      clients[sessionKey].host = ws;
    }
    else
      return endConn(ws);
  }
  else
    return endConn(ws);

  console.log(sessionKey, type, "connected");

  ws.on('message', function incoming(message) {
    console.log('received form', type, message);
    var target_ws = clients[sessionKey].host;
    if(isHost)
      target_ws = clients[sessionKey].client;
    wsSend(target_ws, message);
  });
  ws.on('close', function(){
    console.log('on close', type, 'sessionKey', sessionKey);
    delete clients[sessionKey][type];
    if(Object.keys(clients[sessionKey]).length == 0)
      delete clients[sessionKey][type];
  });
});

function endConn(ws){
  if(!ws)
    return 1;
  wsSendJSON(ws, {type:'kick'});
  ws.close();
  return 1;
}

function wsSendJSON(ws, json){
  if(ws && ws.readyState == 1)
    ws.send(JSON.stringify(json));
}

function wsSend(ws, msg){
  if(ws && ws.readyState == 1)
    ws.send(msg);
}

function SHA1(r){function o(r,o){var e=r<<o|r>>>32-o;return e}function e(r){var o,e,a="";for(o=7;o>=0;o--)e=r>>>4*o&15,a+=e.toString(16);return a}function a(r){r=r.replace(/\r\n/g,"\n");for(var o="",e=0;e<r.length;e++){var a=r.charCodeAt(e);128>a?o+=String.fromCharCode(a):a>127&&2048>a?(o+=String.fromCharCode(a>>6|192),o+=String.fromCharCode(63&a|128)):(o+=String.fromCharCode(a>>12|224),o+=String.fromCharCode(a>>6&63|128),o+=String.fromCharCode(63&a|128))}return o}var t,h,n,C,c,f,d,A,u,g=new Array(80),i=1732584193,s=4023233417,S=2562383102,v=271733878,m=3285377520;r=a(r);var p=r.length,l=new Array;for(h=0;p-3>h;h+=4)n=r.charCodeAt(h)<<24|r.charCodeAt(h+1)<<16|r.charCodeAt(h+2)<<8|r.charCodeAt(h+3),l.push(n);switch(p%4){case 0:h=2147483648;break;case 1:h=r.charCodeAt(p-1)<<24|8388608;break;case 2:h=r.charCodeAt(p-2)<<24|r.charCodeAt(p-1)<<16|32768;break;case 3:h=r.charCodeAt(p-3)<<24|r.charCodeAt(p-2)<<16|r.charCodeAt(p-1)<<8|128}for(l.push(h);l.length%16!=14;)l.push(0);for(l.push(p>>>29),l.push(p<<3&4294967295),t=0;t<l.length;t+=16){for(h=0;16>h;h++)g[h]=l[t+h];for(h=16;79>=h;h++)g[h]=o(g[h-3]^g[h-8]^g[h-14]^g[h-16],1);for(C=i,c=s,f=S,d=v,A=m,h=0;19>=h;h++)u=o(C,5)+(c&f|~c&d)+A+g[h]+1518500249&4294967295,A=d,d=f,f=o(c,30),c=C,C=u;for(h=20;39>=h;h++)u=o(C,5)+(c^f^d)+A+g[h]+1859775393&4294967295,A=d,d=f,f=o(c,30),c=C,C=u;for(h=40;59>=h;h++)u=o(C,5)+(c&f|c&d|f&d)+A+g[h]+2400959708&4294967295,A=d,d=f,f=o(c,30),c=C,C=u;for(h=60;79>=h;h++)u=o(C,5)+(c^f^d)+A+g[h]+3395469782&4294967295,A=d,d=f,f=o(c,30),c=C,C=u;i=i+C&4294967295,s=s+c&4294967295,S=S+f&4294967295,v=v+d&4294967295,m=m+A&4294967295}var u=e(i)+e(s)+e(S)+e(v)+e(m);return u.toLowerCase()}
