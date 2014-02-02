#Static_IP_Redirector
====================

Node.JS based server and client scripts, in which server forwards traffic using iptables to the client on specified ports, and updates clients IP when it changes.

## Requirements
Packages on client and the server:
    node

Modules on server:
    socket.io, sprintf
Modules on client:
    socket.io-client
    
OS:
    Linux
  
## Commands

    help          List all available commands.
    lastip/last   Last IP that has been forwarded to.
    ports/port    List all the ports that forwarding has been enabled to.
    pause         Pause new forwarding requests.
    cresume       Resume new forwarding requests, but disregard the ones received under pause.
    queue         Show the queue of pending requests.
    pop           Remove the last element of the queue.
    shift         Remove the first element of the queue.
    remove/rm     Stop forwarding the port at specified index.
    add           [port | from port, to port] - forward another port.
    stop/shutdown Stops forwarding and shuts down the server.
    
## How to install

Note: First run the server, then the client.

On server
    apt-get install screen node unzip
    
    mkdir -p ~/siprs
    
    cd ~/siprs
    
    wget https://github.com/dnf0sq/Static_IP_Redirector/archive/master.zip
    
    unzip -j master.zip
    
    rm master.zip
    
    rm static_ip_client.js
    
    npm install socket.io sprintf
    
    screen -dmS SIPRS node static_ip_server.js
    
On client
    apt-get install screen node unzip
    
    mkdir -p ~/siprc
    
    cd ~/siprc
    
    wget https://github.com/dnf0sq/Static_IP_Redirector/archive/master.zip
    
    unzip -j master.zip
    
    rm master.zip
    
    rm static_ip_server.js
    
    npm install socket.io-client
    
    screen -dmS SIPRC node static_ip_client.js
    
To access the screen (only needed on the server):
    screen -r SIPRS

To detach from the screen:
    ^A d (CTRL + A, d)
