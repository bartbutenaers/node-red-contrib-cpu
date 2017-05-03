/**
 * Copyright 2017 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    var os = require('os');

    function CpuNode(n) {
        RED.nodes.createNode(this,n);
        
        this.name = n.name;
        this.previousTotalTick = [];
        this.previousTotalIdle = [];

        var node = this;

        node.on("input", function(msg) {
            var currentTotalTick = [];
            var currentTotalIdle = [];
            var outputMessages   = [];
            
            // Calculate the current CPU usage percentage (for each of the 4 CPU cores)
            for(var i = 0, len = os.cpus().length; i < len; i++) {
                currentTotalTick.push(0);
                currentTotalIdle.push(0);
                
                // Current total number of CPU ticks (spent in user, nice, sys, idle, and irq)
                for(var type in os.cpus()[i].times) {
                    currentTotalTick[i] += os.cpus()[i].times[type];
                }
                
                // Current total idle time
                currentTotalIdle[i] += os.cpus()[i].times.idle;
                
                // Difference in idle and total time, compared to the previous calculation.
                // I.e. difference since the last time this node has been triggered!
                var totalTickDifference = currentTotalTick[i] - ( node.previousTotalTick[i] || 0 );
                var totalIdleDifference = currentTotalIdle[i] - ( node.previousTotalIdle[i] || 0 );
                
                // Average percentage CPU usage (of the period since the previous trigger of this node)
                var percentageCPU = 100 - ~~(100 * totalIdleDifference / totalTickDifference);
                
                // Store the CPU usage % in the payload, and the CPU core name in the topic.
                outputMessages.push({ payload:percentageCPU , topic:"core_" + (i+1) , model:os.cpus()[i].model, speed:os.cpus()[i].speed });
            }

            // Store the current counters for the next calculation
            node.previousTotalTick = currentTotalTick;
            node.previousTotalIdle = currentTotalIdle;

            // Send all CPU usage percentages to the output port
            node.send([ outputMessages ]);
        });
    }

    RED.nodes.registerType("cpu",CpuNode);
}