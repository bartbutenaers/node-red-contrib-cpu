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

On the **output port** a separate message will be generated for each core.  Since every core gets it's own `topic` (*core_xxx*), it becomes very easy to display all the cores in a single graph on the dashboard:

![Graph with multiple cores](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_legend.png)

A trigger message should be put on the **input port**, every time the CPU usage should be recalculated.  The calculated CPU usage is the average usage since the previous calculation, so the calculated value will become more accurate when the period between successive calculations is small.  ***As a result, it is advised to apply a trigger message every second on the input port.***

## Output message
An output message will be created for every core.  Every message will contain a number of properties:
* `payload` : The CPU core usage (as a percentage) since the previous calculation.
* `topic` : The virtual name *core_xxx* that links a message to a specific core.
* `model` : The model name of the processor.
* `speed` : The speed of the processor (in MHz).

Following an example of such a message:

![Debug message](https://raw.githubusercontent.com/bartbutenaers/node-red-contrib-cpu/master/images/cpu_debug.png)

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
