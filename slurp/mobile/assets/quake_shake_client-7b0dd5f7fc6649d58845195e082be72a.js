$(function() {
    function t(t) {
        this.pixPerSec = t.pixPerSec, this.timeWindowSec = t.timeWindowSec, this.timeStep = t.timeStep, this.channelHeight = t.channelHeight, this.height = t.height, this.width = t.width, this.buffer = t.buffer, this.axisColor = t.axisColor, this.lineWidth = t.lineWidth, this.tickInterval = t.tickInterval, this.starttime = t.starttime, this.endtime = t.endtime, this.startPixOffset = t.startPixOffset, this.lastTimeFrame = t.lastTimeFrame, this.canvasElement = t.canvasElement, this.localTime = t.localTime, this.stationScalar = t.stationScalar, this.scale = t.scale, this.zoomSliderMin = t.zoomSliderMin, this.zoomSliderMax = t.zoomSliderMax, this.realtime = t.realtime, this.scroll = t.scroll, this.timeout = t.timeout
    }

    function e(t) {
        $("#zoom label").html("Scale (%g)"), t && $("#quake-buttons").is(":visible") ? ($("#playback").show(), $("#quake-buttons").toggle("slide"), $("#mobile-playback").html("Close")) : t && $("#zoom").is(":visible") ? ($("#zoom").hide(), $("#playback").show(), $("#mobile-scale").html("Scale"), $("#mobile-playback").html("Close")) : !t && $("#playback").is(":visible") ? ($("#zoom").show(), $("#playback").hide(), $("#mobile-playback").html("Playback"), $("#mobile-zoom").html("Close")) : t && !$("#quake-buttons").is(":visible") ? ($("#playback").hide(), $("#quake-buttons").toggle("slide"), $("#mobile-playback").html("Playback")) : !t && $("#quake-buttons").is(":visible") ? ($("#zoom").show(), $("#quake-buttons").toggle("slide"), $("#mobile-scale").html("Close")) : t || $("#quake-buttons").is(":visible") || ($("#zoom").hide(), $("#quake-buttons").toggle("slide"), $("#mobile-scale").html("Scale"))
    }
    var i = new t(new canvasConfig);
    $.urlParam = function(t) {
        var e = new RegExp("[?&]" + t + "=([^&#]*)").exec(window.location.href);
        return null == e ? null : e[1] || 0
    }, $("#playback-slider").slider({
        slide: function(t, e) {
            i.realtime || ($("#button-play").removeClass("disabled"), $("#button-stop, #button-realtime").addClass("disabled")), i.selectPlayback(t, e)
        }
    }), $("#zoom-slider").slider({
        min: i.zoomSliderMin,
        max: i.zoomSliderMax,
        value: i.scale,
        step: .05,
        slide: function(t, e) {
            i.selectScale(t, e), $("#quickShakeScale").css("color", "red")
        }
    }), $("#button-play").click(function() {
        return $("#button-play").hasClass("disabled") || (i.playScroll(), $("#button-realtime, #button-stop").removeClass("disabled"), $("#button-play").addClass("disabled")), !1
    }), $("#button-stop").click(function() {
        return $("#button-stop").hasClass("disabled") || (i.pauseScroll(), $("#button-play").removeClass("disabled"), $("#button-stop, #button-realtime").addClass("disabled")), !1
    }), $("#button-realtime").click(function() {
        return $("#button-realtime").hasClass("disabled") || i.realtime || ($("#button-realtime").addClass("disabled"), i.realtime = !0), !1
    });
    var s = new WebSocket(host);
    s.onopen = function() {
        i.setTimeout(), i.fullWidth()
    }, s.onmessage = function(t) {
	t = t.data;
        var e = JSON.parse(t);
	if ( e.notification ) {
		alert(e.notification);
	} else {
	        i.updateBuffer(e)
	}
    }, t.prototype.updateBuffer = function(t) {
        null == this.lastTimeFrame && (this.lastTimeFrame = this.makeTimeKey(t.starttime), this.startPixOffset -= 4 * this.pixPerSec, this.height = channels.length * this.channelHeight + 44, this.canvasElement.height = this.height, this.canvasElement.width = this.width), null == this.buffer && (this.buffer = {}), t.starttime < this.starttime && (this.starttime = this.makeTimeKey(t.starttime)), t.endtime > this.endtime && (this.endtime = this.makeTimeKey(t.endtime)), this.updatePlaybackSlider();
        for (var e = t.samprate / this.pixPerSec, i = 0, s = t.starttime; i < t.data.length;) {
            var a = Math.round(i += e);
            a < t.data.length && (this.buffer[this.makeTimeKey(s)] || (this.buffer[this.makeTimeKey(s)] = {}), this.buffer[this.makeTimeKey(s)][this.makeChanKey(t)] = t.data[a] / this.stationScalar, s += this.timeStep)
        }
    }, t.prototype.drawSignal = function() {
        if (this.scroll) {
            if (this.startPixOffset > 0 ? this.startPixOffset-- : this.lastTimeFrame += this.timeStep, this.realtime) {
                var t = parseInt((this.endtime - this.lastTimeFrame) / 1e3 * this.pixPerSec - this.width + this.startPixOffset, 0),
                    e = 0;
                t > -50 && 20 > t && (e = 2), t > 20 && (e = 4), t > 100 && (e = 9), t > 1e3 && (e = 99), t > 1e4 && (e = 9999), this.lastTimeFrame += e * this.timeStep, this.startPixOffset = Math.max(0, this.startPixOffset - e)
            }
            if ((this.endtime - this.starttime) / 1e3 * this.pixPerSec > 6 * this.width) {
                for (var i = this.starttime; i < this.starttime + 3 * this.timeWindowSec * 1e3;) delete this.buffer[i], i += this.timeStep;
                this.starttime = i
            }
        }
        var s = this.lastTimeFrame,
            a = this.lastTimeFrame + 1e3 * this.timeWindowSec;
        if (a > s) {
            var l = this.canvasElement.getContext("2d");
            l.clearRect(0, 0, this.width, this.height), l.lineWidth = this.lineWidth, this.drawAxes(l), l.beginPath();
            for (var o = 0; o < channels.length; o++) {
                var h = channels[o];
                s = this.lastTimeFrame;
                for (var n = 0, r = this.starttime, c = 0; r <= this.endtime;) {
                    if (this.buffer[r] && this.buffer[r][h.key]) {
                        var m = this.buffer[r][h.key];
                        n += m, c++
                    }
                    r += this.timeStep
                }
                var u = n / c;
                l.strokeStyle = h.lineColor;
                var d = this.startPixOffset,
                    p = !0;
                for (c = 0; a >= s;) {
                    if (this.buffer[s] && this.buffer[s][h.key]) {
                        var m = this.buffer[s][h.key],
                            f = (m - u) * Math.pow(10, this.scale); - 1 > f && (f = -1), f > 1 && (f = 1);
                        var b = 22 + this.channelHeight / 2 + this.channelHeight * h.position,
                            k = Math.round(this.channelHeight / 2 * f + b);
                        p ? (l.moveTo(d, k), p = !1) : l.lineTo(d, k)
                    } else p = !0;
                    d++, s += this.timeStep
                }
                l.stroke()
            }
        }
    }, t.prototype.makeTimeKey = function(t) {
        return parseInt(t / this.timeStep, 0) * this.timeStep
    }, t.prototype.makeChanKey = function(t) {
        var e = t.loc && "--" != t.loc && "" != this.loc ? "_" + t.loc : "";
        return t.sta.toLowerCase() + "_" + t.chan.toLowerCase() + "_" + t.net.toLowerCase() + e
    }, t.prototype.drawAxes = function(t) {
        var e = {
            left: 0,
            right: this.width,
            top: 20,
            bottom: this.height - 20
        };
        t.beginPath(), t.moveTo(e.left, e.top), t.lineTo(e.right, e.top), t.moveTo(e.left, e.bottom), t.lineTo(e.right, e.bottom), t.moveTo(e.left, e.top), t.lineTo(e.left, e.bottom), t.moveTo(e.right, e.top), t.lineTo(e.right, e.bottom), t.font = "15px Helvetica, Arial, sans-serif", t.strokeStyle = "#119247", t.stroke(), t.beginPath();
        for (var i = 0; i < channels.length; i++) {
            var s = channels[i],
                a = s.position * this.channelHeight;
            t.fillText(s.sta, e.left + 10, 40 + a);
            var l = 22 + this.channelHeight / 2 + a;
            t.moveTo(e.left, l), t.lineTo(e.right, l)
        }
        t.strokeStyle = "#CCCCCC", t.stroke(), t.beginPath(), t.font = "13px Helvetica, Arial, sans-serif";
        for (var o = this.lastTimeFrame % this.tickInterval, h = this.lastTimeFrame - o, n = this.startPixOffset - o / this.timeStep, r = this.tickInterval / this.timeStep; n < e.right + 20;) t.moveTo(n, 20), t.lineTo(n, this.height - 15), t.fillText(this.dateFormat(h), n - 23, 12), t.fillText(this.dateFormat(h), n - 23, this.height - 1), n += r, h += this.tickInterval;
        t.strokeStyle = "#CCCCCC", t.stroke()
    }, t.prototype.dateFormat = function(t) {
        var e = new Date(t);
        if (this.localTime) var i = e.getHours(),
            s = e.getMinutes(),
            a = e.getSeconds();
        else var i = e.getUTCHours(),
            s = e.getUTCMinutes(),
            a = e.getUTCSeconds();
        var l;
        return 10 > i && (i = "0" + i), 10 > s && (s = "0" + s), 10 > a && (a = "0" + a), l = i + ":" + s + ":" + a, "00" == a && (l += " PST"), l
    }, t.prototype.updatePlaybackSlider = function() {
        $("#playback-slider").slider("option", "max", this.endtime), $("#playback-slider").slider("option", "min", this.starttime), this.scroll && $("#playback-slider").slider("option", "value", this.lastTimeFrame)
    }, t.prototype.pauseScroll = function() {
        clearInterval(this.scroll), this.scroll = null, this.realtime = !1
    }, t.prototype.playScroll = function() {
        _this = this, this.scroll = setInterval(function() {
            null != _this.buffer && _this.drawSignal()
        }, 1e3 / this.pixPerSec)
    }, t.prototype.selectPlayback = function(t, e) {
        if (0 == this.startPixOffset) {
            this.scroll && this.pauseScroll();
            var i = e.value;
            i > this.endtime ? $("#playback-slider").slider("option", "value", this.lastTimeFrame) : (this.lastTimeFrame = this.makeTimeKey(i), this.drawSignal())
        }
    }, t.prototype.setTimeout = function() {
        function t() {
            $("#timer").html(l - a > 1 ? "Stream will stop in " + (l - a) + " minutes." : l - a == 1 ? "Stream will stop in " + (l - a) + " minute." : "Stream has ended."), a == o ? h.css("display", "block") : a == l && s.close(), h.click(e), a++
        }

        function e() {
            s.connected || (s.open(), i.realtime = !0), h.css("display", "none"), a = 0
        }
        if ($.urlParam("timeout") || null == $.urlParam("timeout")) {
            var a = (setInterval(t, 6e4), 0);
            $("body").keypress(e), $("body").click(e); {
                var l = this.timeout + 5,
                    o = this.timeout,
                    h = $("#timeout");
                this.channelHeight * (channels.length + .5) + 44 + 35
            }
            h.css("height", $(window).height() + "px"), h.css("width", $(window).width() + "px"), $("#timeout").css("padding-top", $(window).height() / 2 - 30 + "px")
        }
    }, t.prototype.selectScale = function(t, e) {
        this.scale = e.value, this.scroll || this.drawSignal(), this.updateScale()
    }, t.prototype.updateScale = function() {
        $("#quickShakeScale").css("height", this.channelHeight / 2);
        var t = Math.pow(10, -this.scale);
        t = 99e-6 > t ? t.toExponential(2) : t.toPrecision(2), $("#top").html(t)
    }, t.prototype.fullWidth = function() {
        $("#header, #footer, #stage-warning, #full-width, #quick-oops").hide(), $("#quick-body, #quakeLogo").show(), $("#page").css("margin-top", "0px");
        var t = 60,
            e = ($("#hawkBanner").height(), $(window).height() - $("#page").height() - 105),
            i = $(window).width() - 1.2 * t;
        if (!$("#quickShake").is(":visible")) var e = $(window).height() - 150,
            i = $(window).width() - 20;
        $("#quakeShake").css("top", $("#page").height() + "px"), $("#quickShakeScale").css("top", $("#page").height() + 21 + "px"), this.channelHeight = e / channels.length, this.width = i, this.startPixOffset = this.width, this.updateScale()
    }, $("#mobile-scale").click(function() {
        e(!1)
    }), $("#zoom").mouseenter(function() {
        $("#quickShakeScale").css("color", "red")
    }).mouseleave(function() {
        $("#quickShakeScale").css("color", "initial")
    }), $("#mobile-playback").click(function() {
        e(!0)
    }), $(window).resize(function() {
        location.reload()
    }), i.playScroll()
});
