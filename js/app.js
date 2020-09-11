var updateTemps;
var updateClock;
var vibrateTimer;
var snoozeTimer;
var snoozeAlerts=false;
//var ticks;

(function () {
	tizen.application.launch("WXlk9nvDtA.thermoservice",function() {
		console.log("opened service");
	}, function(error) {
		console.log("failed to open service ",error);
	});
			
	/*
	var appControlReplyCallback = {
			// callee sent a reply
			onsuccess: function(data) {

				console.log("success");

			},
			// callee returned failure
			onfailure: function() {
				console.log('The launch application control failed');
			}
	}
	
	var obj = new tizen.ApplicationControlData("WXlk9nvDtA.thermoservice",["success"]);
	
	var obj1 = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/service",
					null,
					null,
					null,
					[obj] 
			);
	
	tizen.application.launchAppControl(obj1,
			"WXlk9nvDtA.thermoservice",
			function() {console.log("Launch Service succeeded");},
			function(e) {console.log("Launch Service failed : " + e.message);},
			appControlReplyCallback);
	*/
	
	moment.locale('en-my-settings', {
	    relativeTime : {
	        future: "in %s",
	        //past:   "%s ago",
	        past: function(str) {
        	        if (str==="just now") {return str;} else {return str+" ago";} 
        	 },
	        //s  : 'just now',
	        s  : function(num, noSuffix, key, future) {
	        	   if (key==="s" && !future) {
	        	     return "just now";
	        	   } else {return 'a few seconds';} 
	        	 },
	        ss : '%d seconds',
	        m:  "a minute",
	        mm: "%d minutes",
	        h:  "an hour",
	        hh: "%d hours",
	        d:  "a day",
	        dd: "%d days",
	        M:  "a month",
	        MM: "%d months",
	        y:  "a year",
	        yy: "%d years"
	    }
	});
	updateClock=setInterval(getTime,1000);
	updateTemps=setInterval(getTemps,8000);
	getTime();
	getTemps();

	
	function onScreenStateChanged(previousState, changedState) {
		console.log('Screen state changed from ' + previousState + ' to ' + changedState);
		
		//here I would use tizen.power.turnScreenOn():
		//tizen.power.request("SCREEN", "SCREEN_NORMAL");
		if (changedState==="SCREEN_NORMAL") {
			pageBeforeShowHandler();
			var app = tizen.application.getCurrentApplication();
			//app is launched just in case it is currently in background
			//tizen.application.launch(app.appInfo.id, launchSuccess);
			tizen.application.launch(app.appInfo.id, function launchSuccess() {
				console.log("app launched");
			});
		} else if (changedState==="SCREEN_OFF") {
			pageHideHandler();
		}
	}
	tizen.power.setScreenStateChangeListener(onScreenStateChanged);
	
	window.addEventListener("tizenhwkey", function (ev) {
		var activePopup = null,
			page = null,
			pageId = "";

		if (ev.keyName === "back") {
			activePopup = document.querySelector(".ui-popup-active");
			page = document.getElementsByClassName("ui-page-active")[0];
			pageId = page ? page.id : "";

			if (pageId === "main" && !activePopup) {
				try {
					tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				window.history.back();
			}
		}
	});
	
	window.addEventListener("visibilitychange", function() {
	    if (document.hidden) {
	    	pageHideHandler();
	        console.log('document hidden');
	    } else  {
	    	pageBeforeShowHandler();
	        console.log('document visible');
	    }
	}, false);
	
    var page=document.getElementById('main');

    function pageBeforeShowHandler() {
    	updateTemps=clearInterval(updateTemps);
    	updateClock=setInterval(getTime,1000);
    	updateTemps=setInterval(getTemps,8000);
    	getTime();
    	getTemps();
    }

    function pageHideHandler() {
    	updateTemps=clearInterval(updateTemps);
    	updateClock=clearInterval(updateClock);
    	updateTemps=setInterval(getTemps,36000);
    }
    page.addEventListener('pagebeforeshow', pageBeforeShowHandler);
    page.addEventListener('pagehide', pageHideHandler);
}());

function tempAlert() {
	//tizen.power.request("SCREEN","SCREEN_NORMAL");
	//tizen.power.turnScreenOn();
	//document.getElementById("bottomBtnPopup").style.display="block";
	tau.openPopup("#bottomBtnPopup");
    console.log("in tempAlert");
	shakeIt();
	vibrateTimer=setInterval(shakeIt,4000);
}

function shakeIt() {
	console.log("in shakeIt");
	var popup=document.getElementById("bottomBtnPopup");
	//tizen.power.turnScreenOn();
	//document.getElementById("bottomBtnPopup").style.display="block";
	//navigator.vibrate([200,30,200,30,200,30,400,30,400,30,400,30,200,30,200,30,200]);
	if (popup && window.getComputedStyle(popup).display==="none") {
		tau.openPopup("#bottomBtnPopup");	
	}
		
	try {
	    tizen.feedback.play('WAKEUP','TYPE_VIBRATION');
	} catch (err) {
	    console.log(err.name + ': ' + err.message);
	}
}

function killShake() {
	console.log("in killShake");
	tizen.feedback.stop();
	//document.getElementById('bottomBtnPopup').style.display='none';
	tau.closePopup();
	//navigator.vibrate(0);
	vibrateTimer=clearInterval(vibrateTimer);
	snoozeAlerts=true;
	snoozeTimer=setInterval(unSnooze,60000);
}

function unSnooze() {
	console.log("in unSnooze");
	snoozeAlerts=false;
	snoozeTimer=clearInterval(snoozeTimer);
}


function getTemps() {
	console.log("in getTemps");
	document.getElementById("status").style.display="none";
	document.getElementById("spinner").style.display="block";
	getLabels();
	/*
	var probe0=document.getElementById("probe0");
	var probe1=document.getElementById("probe1");
	var probe2=document.getElementById("probe2");
	var probe3=document.getElementById("probe3");
	var client = new XMLHttpRequest();
	client.open('GET','https://thermi.pro:39780/api/getLastReading');
	client.setRequestHeader('Content-Type', 'application/json');
	client.onreadystatechange = function() {
	    if (client.readyState === XMLHttpRequest.DONE) {
	    	tizen.power.release('CPU');
	    	document.getElementById("spinner").style.display="none";
	    	document.getElementById("status").style.display="block";
	    	console.log("got temp at "+tizen.time.getCurrentDateTime());
	    	console.log(JSON.parse(client.responseText));
	    	var theResult=JSON.parse(client.responseText);
	    	if (theResult.probe0===undefined && 
	    		theResult.probe1===undefined &&
	    		theResult.probe2===undefined &&
	    		theResult.probe3===undefined &&
	    		theResult.time==="December 1969") {
		    	document.getElementById("probe0").textContent="???";
		    	document.getElementById("probe1").textContent="???";
		    	document.getElementById("probe2").textContent="???";
		    	document.getElementById("probe3").textContent="???";
		    	document.getElementById("status").textContent="Inactive";	    		
	    	} else {
	    		//probe0
		    	if (theResult.probe0!=="N/C") {
		    		probe0.textContent=parseFloat(theResult.probe0).toFixed(1)+"°";
			    	//probe0.style.color=theResult.foodColor;
		    	} else {
		    		probe0.textContent=theResult.probe0;
		    	}
		    	
		    	//probe1
		    	if (theResult.probe1!=="N/C") {
		    		probe1.textContent=parseFloat(theResult.probe1).toFixed(1)+"°";
			    	//probe1.style.color=theResult.pitColor;
		    	} else {
		    		probe1.textContent=theResult.probe1;
		    	}
		    	
	    		//probe2
		    	if (theResult.probe0!=="N/C") {
		    		probe2.textContent=parseFloat(theResult.probe2).toFixed(1)+"°";
			    	//probe0.style.color=theResult.foodColor;
		    	} else {
		    		probe2.textContent=theResult.probe2;
		    	}
		    	
	    		//probe3
		    	if (theResult.probe0!=="N/C") {
		    		probe3.textContent=parseFloat(theResult.probe3).toFixed(1)+"°";
			    	//probe3.style.color=theResult.foodColor;
		    	} else {
		    		probe3.textContent=theResult.probe3;
		    	}
		    	
		    	var date=new Date(theResult.time);
		    	document.getElementById("status").textContent=moment(date).fromNow();
	    	}
	    	getLabels();
	    }
	};
	client.onerror = function() {
		console.log("err");
		document.getElementById("status").textContent="Connection Failed";
	};
	
	client.send();
	*/
}

function getLabels() {
	console.log("in getLabels");
	var p0label=document.getElementById("p0label");
	var p1label=document.getElementById("p1label");
	var p2label=document.getElementById("p2label");
	var p3label=document.getElementById("p3label");
	var client = new XMLHttpRequest();
	console.log("snoozeAlerts is "+snoozeAlerts);
	client.open('GET','https://thermi.pro:39780/api/getLabels');
	client.setRequestHeader('Content-Type', 'application/json');
	client.onreadystatechange = function() {
	    if (client.readyState === XMLHttpRequest.DONE) {
	    	console.log(JSON.parse(client.responseText));
	    	var theResult=JSON.parse(client.responseText);	    		
			//probe0
	    	p0label.textContent=theResult.probe0;
	    	p1label.textContent=theResult.probe1;
	    	p2label.textContent=theResult.probe2;
	    	p3label.textContent=theResult.probe3;
	    	if (theResult.probe0==="Alert!") {
	    		if (!snoozeAlerts && typeof vibrateTimer==='undefined') {
		    		console.log("alert criteria met in getLabels");
		    		tempAlert();
	    		}
	    	} else {
	    		tizen.feedback.stop();
	    		document.getElementById('bottomBtnPopup').style.display='none';
	    		vibrateTimer=clearInterval(vibrateTimer);
	    		snoozeAlerts=false;
	    	}
	    }
	};
	client.onerror = function() {
		console.log("err");
		document.getElementById("status").textContent="Connection Failed";
	};
	
	client.send();
}

/*
function updateHeartbeat() {
	ticks=ticks+5;
	console.log(ticks);
}
*/

function getTime() {
	var dateTime=tizen.time.getCurrentDateTime();
	document.getElementById("time").textContent=dateTime.toLocaleTimeString();
}