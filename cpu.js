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
    var systemInfo = require('systeminformation');

    function CpuNode(n) {
        RED.nodes.createNode(this,n);
        this.msgCore = (n.msgCore === undefined) ? true : n.msgCore;
        this.msgOverall = (n.msgOverall === undefined) ? false : n.msgOverall;
        this.msgArray = (n.msgArray === undefined) ? false : n.msgArray;
        this.msgTemp = (n.msgTemp === undefined) ? false : n.msgTemp;
        this.name = n.name;
        this.previousTotalTick = []; 
        this.previousTotalIdle = [];
        
        var node = this;

        node.on("input", function(msg) {
            var currentTotalTick = [];
            var currentTotalIdle = [];
            var coreOutputMessages = [];
            var coreArray = [];
            var overallUsagePercentage = 0;
                  
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
                coreOutputMessages.push({ payload:percentageCPU, topic:"core_" + (i+1), model:os.cpus()[i].model, speed:os.cpus()[i].speed });
                
                // Store the CPU info in an array
                coreArray.push({ name:"core_" + (i+1), usage:percentageCPU, model:os.cpus()[i].model, speed:os.cpus()[i].speed });
                
                overallUsagePercentage += percentageCPU;
            }
            
            // Store the current counters for the next calculation
            node.previousTotalTick = currentTotalTick;
            node.previousTotalIdle = currentTotalIdle;

            // Send all CPU usage percentages to the output port, if requested
            if (node.msgCore == true) {
                node.send([ coreOutputMessages ]);
            }
            
            // Send the overall CPU usage percentage to the output port, if requested
            if (node.msgOverall == true) {
                if (coreOutputMessages.length > 0) {
                    // Calculate the percentage of overal usage.  
                    // E.g. if we have two cores with 40% and 30% usage, the overal usage will be (40 + 30)/2 = 35%
                    overallUsagePercentage = overallUsagePercentage / coreOutputMessages.length;
                }
                
                node.send({ payload:overallUsagePercentage , topic:"overall" });
            }

            // Send all the information of every CPU in an array to the output port, if requested
            if (node.msgArray == true) {
                node.send({ payload: coreArray, topic:"all_cores" });
            }

            // Send CPU temperature(s), if requested
            if (node.msgTemp == true) {
                systemInfo.cpuTemperature(function(data) {
                    node.send({ payload: data.main, max: data.max, cores:data.cores, topic:"temperature" });
                });
            }
        });
    }

    RED.nodes.registerType("cpu",CpuNode);
}
