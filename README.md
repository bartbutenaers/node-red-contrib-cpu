# node-red-contrib-cpu
A Node Red node for monitoring CPU usage

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-cpu
```
## Usage
This node will monitor the CPU usage, based on the [Node.js OS Library](https://nodejs.org/api/os.html).  

An example flow:

![Flow](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_flow.png)

A trigger message should be send to the **input**, every time the CPU usage should be recalculated.  The calculated CPU usage is the average usage since the previous calculation, so the calculated value will become more accurate when the period between successive calculations is small.  ***As a result, it is advised to apply a trigger message every second on the input.***

### Single output message for overall cpu usage
When this option is selected, a single output message will be generated that contains the ***overall*** CPU usage (with topic *'overall'*).  The overall CPU usage is calculated as the ***average*** usage of all cores:

![Formula](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_formula.png)

Simon Hailes adviced me to add this option, since the graphs per core can become too *noisy*.  For example, from following graph you might conclude (incorrectly!) that video processing (using the OpenCv library) uses nicely all 4 cores of a Raspberry Pi:

![Formula](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_each_core.png)

However when looking at the overall CPU usage, it becomes clear that only 25% of the Raspberry Pi CPU resources is being used:

![Formula](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_overall.png)

This means that the library uses all 4 available cores, but in total only 25% of the 4 cores...

There will be a single output message, containing the overall data of all cores:
+ `msg.payload` is the overall usage percentage (*sum of usage of all cores / number of cores*)
+ `msg.speed` is processor speed (in MHz)
+ `msg.topic` is a fixed text (***overall***)
+ `msg.model` is the CPU model

### Separate output message for each core
When this option is selected, an output message will be generated for each core individually.  Since every core gets it's own `topic` (*core_xxx*), it becomes very easy to display all the cores in a single graph on the dashboard:

![Graph with multiple cores](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_legend.png)

The output message for each core will look like this:
+ `msg.payload` is the core usage (as a percentage)
+ `msg.speed` is processor speed (in MHz)
+ `msg.topic` is the name of the (logical) CPU core (***core_xxx***)
+ `msg.model` is the CPU model

This is an example of such an output message:

![Debug message](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_debug.png)

### Single output message with array of core usages
When this option is selected, a single output message will be generated that contains an array of all CPU usages (with topic *'all_cores'*).
+ `msg.payload` is the array with information of all the available cores:
   + `name` is the name of the (logical) CPU core (***core_xxx***)
   + `usage` is the core usage (as a percentage)
   + `model` is the CPU model
   + `speed` is the processor speed (in MHz)
+ `msg.topic` is a fixed text (***all_cores***)

### Single output message with core temperature(s)
When this option is selected, a single output message will be generated that contains the temperature values in °C (with topic *'temperature'*).

![Temperature graph](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_temperature_graph.png)

The output message will look like this:
+ `msg.payload` is the main (average) temperature
+ `msg.max` is maximum temperature
+ `msg.cores` is an array of temperatures of all cores
+ `msg.topic` is a fixed text (***temperature***)

CAUTION: the temperature values are not available on all systems (e.g. on Sun systems)!  And on some systems the `msg.cores` array will be empty (e.g. on Raspberry Pi 3), but instead the main temperature might be available.

## Core definition
As mentioned before, data will be outputted for every core.  However what does a core represent?  

In case of a system with N processors (and M cores in each processor), the total number of **physical** cores in the graph will be NxM.

However sometimes we will get much more **virtual** cores on the output (compared to the number of physical cores).  This could be the case for example with processors that support [Hyper threading](https://en.wikipedia.org/wiki/Hyper-threading).

## Troubleshooting
This node can be used to detect performance issues easily, without having to install extra third-party tools.

As a starting point (to compare your own CPU usage graph), a basic Node-Red flow uses very few core resources (except from the deploy period):

![Basic flow graph](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_graph.png)

## Alternative
The The [node-red-contrib-os](https://www.npmjs.com/package/node-red-contrib-os) node also contains a 'cpus' node, which can be used to get the same kind of information.  However there are some differences between both nodes:

|                    | node-red-contrib-os (cpus)             |  node-red-contrib-cpu |
| ------------------ |:--------------------------------------:| :--------------------:|
| Multiple cores     | all in 1 msg                           | separate messages     |
| Measurement start  | system startup                         | previous calculation  |
| Output value       | multiple values (idle, user, sys ...)  | single percentage     |

Summarized the node-red-contrib-cpu node is some kind of convenience node, that takes care of all calculations in case you want to live monitor the CPU usages. 
