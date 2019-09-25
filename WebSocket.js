//WebSocket.js
var lockReconnect = false;  //避免ws重复连接
var ws = null;
var vm = new Vue({
    el: '#app',
})
import router from './router'
import store from './store'
function createWebSocket(wsUrl, token) {
    try {
        if ('WebSocket' in window) {
            ws = new WebSocket(wsUrl);   // 建立连接 


        } else if ('MozWebSocket' in window) {

            ws = new MozWebSocket(wsUrl);
        } else {
            layui.use(['layer'], function () {
                var layer = layui.layer;
                layer.alert("您的浏览器不支持websocket协议,建议使用新版谷歌、火狐等浏览器，请勿使用IE10以下浏览器，360浏览器请使用极速模式，不要使用兼容模式！");
            });
        }
        initEventHandle(token);  // 调用了下面WebSocket的方法

    } catch (e) {
        reconnect(wsUrl);

    }
}
function initEventHandle(token) {

    // 关闭连接后的回调
    ws.onclose = function () {

        console.log("连接关闭!" + new Date().toUTCString(), ws);
    };
    ws.onerror = function () {
        // 连接错误后尝试重新连接
        console.log(ws, "连接错误")

    };
    // 建立连接成功发送消息给后端
    ws.onopen = function () {

        heartCheck.reset().start(token);      //心跳检测重置
        console.log("连接成功!" + new Date().toUTCString());
    };
    // 建立连接成功接收后端发送的消息
    ws.onmessage = function (event) {    //如果获取到消息，心跳检测重置
        heartCheck.reset().start(token);
        var status = JSON.parse(event.data)
        if (status.status == 0) {//status为0代表有其他人登陆该账号，关闭WebSocket清除账号信息返回首页
            sessionStorage.removeItem("userInfo");
            ws.close();
            router.push({ name: "Login" });
            vm.$message({
                showClose: true,
                message: "你的账号已在其他地方登陆！",
                type: "error"
            });
        } else if (status.status == 2) {
            store.commit("increment")
            vm.playAudio()
            vm.$message({
                showClose: true,
                message: status.message,
                type: "warning",
                duration: 6000
            });
        } else if (status.status == 3) {
            store.commit("increment")
            vm.playAudio()
            vm.$message({
                showClose: true,
                message: status.message,
                type: "warning",
                duration: 6000
            });
        } else if (status.status == 4) {
            store.commit("increment")
            vm.playAudio()
            vm.$message({
                showClose: true,
                message: status.message,
                type: "warning",
                duration: 6000
            });
        } else if (status.status != 1 && status.status != 0) {
            store.commit("increment")
        }
        //把服务端返回的内容缓存起来，后期来做判断
        console.log(status.status, event.data, "收到消息啦:");
    }
}
//主动断开连接的方法
function close() {
    ws.close();
    // 清除心跳定时器
    heartCheck.reset();
}
// 断开重连
function reconnect(url) {
    if (lockReconnect) return;
    lockReconnect = true;
    setTimeout(function () {     //没连接上会一直重连，设置延迟避免请求过多
        createWebSocket(url);
        lockReconnect = false;
    }, 2000);
}

//心跳检测
var heartCheck = {

    timeout: 5000,        //5秒发一次心跳
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function () {
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
        return this;
    },
    start: function (token) {
        var self = this;
        this.timeoutObj = setTimeout(function () {

            //这里发送一个心跳，后端收到后，返回一个心跳消息，
            //onmessage拿到返回的心跳就说明连接正常
            ws.send(token);
            self.serverTimeoutObj = setTimeout(function () {//如果超过一定时间还没重置，说明后端主动断开了
                ws.close();     //如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
            }, self.timeout)
        }, this.timeout)
    }
}
export default {
    createWebSocket,
    close,
}