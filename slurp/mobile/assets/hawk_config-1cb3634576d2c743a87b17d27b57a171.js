$(function(){function t(t){this.sta=t.sta,this.chan=t.chan,this.net=t.net,this.loc=t.loc;var i=this.loc&&"--"!=this.loc&&""!=this.loc?"_"+this.loc:"";this.key=this.sta.toLowerCase()+"_"+this.chan.toLowerCase()+"_"+this.net.toLowerCase()+i,this.lineColor=t.lineColor,this.position=t.position}var i={shBlue:"#00102F",shGreen:"#5CBD59",shDarkBlue:"#061830"};canvasConfig=function(){this.pixPerSec=20,this.timeWindowSec=102.4,this.timeStep=1e3/this.pixPerSec,this.channelHeight=200,this.height=null,this.width=this.timeWindowSec*this.pixPerSec,this.buffer=null,this.axisColor="#000",this.lineWidth=1,this.tickInterval=1e4,this.starttime=1e3*Date.now(),this.endtime=0,this.startPixOffset=this.width,this.lastTimeFrame=null,this.canvasElement=document.getElementById("quakeShake"),this.localTime=!0,this.stationScalar=3.20793*Math.pow(10,5)*9.8,this.scale=2,this.zoomSliderMin=0,this.zoomSliderMax=3,this.realtime=!0,this.scroll=null,this.timeout=30},channels=[new t({sta:"HWK1",chan:"HNZ",net:"UW",loc:"--",max:null,position:2,lineColor:i.shBlue}),new t({sta:"HWK2",chan:"HNZ",net:"UW",loc:"00",max:null,position:1,lineColor:i.shGreen}),new t({sta:"HWK3",chan:"HNZ",net:"UW",loc:"--",max:null,position:0,lineColor:i.shDarkBlue})],host="ws://csiopsalt.cloudapp.net:8080"});