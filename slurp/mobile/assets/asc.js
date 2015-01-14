var pixPerSec = 20;
var timeStep=1e3/pixPerSec;

    updateBuffer = function(packet) {
        if (lastTimeFrame == null) {
            lastTimeFrame = makeTimeKey(packet.starttime);
            startPixOffset -= (pixPerSec * 4);
        }

        if (buffer == null)
            buffer = {};
        //update times to track oldest and youngest data points
        if (packet.starttime < starttime)
            starttime = makeTimeKey(packet.starttime);
        if (packet.endtime > endtime)
            endtime = makeTimeKey(packet.endtime);
        //decimate data
        var _decimate = packet.samprate / pixPerSec;
        var _i = 0;
        var _t = packet.starttime;
        while (_i < packet.data.length) {
            var _index = Math.round(_i += _decimate);
            if (_index < packet.data.length) {
                if (!buffer[makeTimeKey(_t)]) {
                    buffer[makeTimeKey(_t)] = {};
                }
                buffer[makeTimeKey(_t)][makeChanKey(packet)] = packet.data[_index] / stationScalar;
                _t += timeStep;

            }
        }
    };

    drawSignal = function() {
        if (scroll) {
            //OFFSET at start
            if (startPixOffset > 0) {
                startPixOffset--;
            } else {
                lastTimeFrame += timeStep;
            }

            //ADJUST PLAYwe need to adjust play if data on end of buffer tails off canvas
            //ideally we want new data written on canvas at about 10 seconds in 
            if (realtime) {
                var tail = parseInt(((endtime - lastTimeFrame) / 1000 * pixPerSec) - width + startPixOffset, 0);
                var pad = 0;
                if (tail > -50 && tail < 20)
                    pad = 2;
                if (tail > 20)
                    pad = 4;
                if (tail > 100)
                    pad = 9;
                if (tail > 1000)
                    pad = 99;
                if (tail > 10000)
                    pad = 9999;
                //need to adjust these two values if we added padding
                lastTimeFrame += pad * timeStep;
                startPixOffset = Math.max(0, startPixOffset - pad);
            }

            //PRUNE the buffer at 6 canvas widths by three canvas widths
            if (((endtime - starttime) / 1000) * pixPerSec > 6 * width) {
                var time = starttime;
                while (time < starttime + 3 * timeWindowSec * 1000) {
                    delete buffer[time];
                    time += timeStep;
                }
                starttime = time;
            }
        }

        // FIND MEAN AND Extreme vals
        var start = lastTimeFrame;
        var stop = lastTimeFrame + timeWindowSec * 1000;
        if (start < stop) {
            var ctx = canvasElement.getContext("2d");
            ctx.clearRect(0, 0, width, height);
            ctx.lineWidth = lineWidth;
            drawAxes(ctx);

            ctx.beginPath();

            //iterate through all channels and draw
            for (var i = 0; i < channels.length; i++) {
                var channel = channels[i];
                start = lastTimeFrame;


                //find mean and max
                var sum = 0;
                // var min = Number.MAX_VALUE;
                // var max = -Number.MAX_VALUE;
                //use full array for ave an max
                var starttime = starttime;
                var count = 0;
                while (starttime <= endtime) {
                    if (buffer[starttime] && buffer[starttime][channel.key]) {
                        var val = buffer[starttime][channel.key];
                        sum += val;
                        // max = val > max ? val : max;
                        // min = val < min ? val :min;
                        count++;

                    }
                    starttime += timeStep;
                }
                var mean = sum / count;

                // //switch vals if min is further from center
                // if(Math.abs(max - mean) < Math.abs(min - mean)){
                //   max = min;
                // };
                //
                // scale is default 1 and adjusted by zoom slider
                // max = parseInt(Math.abs(max-mean)*scale,0);

                while (start <= stop) {
                    if (buffer[start] && buffer[start][channel.key]) {
                        var val = buffer[start][channel.key];
                        var norm = ((val - mean) * Math.pow(10, scale));

                        if (norm < -1)
                            norm = -1;
                        if (norm > 1)
                            norm = 1;

                        var chanAxis = 22 + (channelHeight / 2) + channelHeight * channel.position; //22 is offset for header timeline.
                        var yval = Math.round((channelHeight) / 2 * norm + chanAxis);

                        if (gap) {
                            ctx.moveTo(canvasIndex, yval);
                            gap = false;
                        } else {
                            ctx.lineTo(canvasIndex, yval);
                        }
                    } else {
                        gap = true;
                    }
                    canvasIndex++;
                    start += timeStep;

                } //while
                ctx.stroke();

            }
        }
    };

    makeTimeKey = function(t) {
        return parseInt(t / timeStep, 0) * timeStep;
    };
