# tls12-https-proxy
TLS 1.2 Proxy designed to provide a method for communicating with TLS 1.2 only sites for older languages that lack the ability to do it directly. 

# Configure
### Linux Users
``` bash
sudo apt update && sudo apt install git nodejs npm
git clone https://github.com/TimothyMeadows/tls12-https-proxy
chmod +x ./configure
./configure
npm start
```
### Windows Users
* Download & Install node.js: https://nodejs.org/en/download/
* Download the repository: https://github.com/TimothyMeadows/tls12-https-proxy/archive/master.zip
* Extract the zip and put it in a location you are happy with such as C:\tls12-https-proxy\
* Navigate to the folder you just extracted
* Hold shift and right click in the folder then select 'Open command window here'
* Type the commands below into the command window:
``` bash
configure.bat
npm start
```
