# tls12-https-proxy
TLS 1.2 Proxy designed to provide a method for communicating with TLS 1.2 only sites for older languages that lack the ability to do it directly. 

# Configure
### Linux Users
* Type the commands below into a shell window:
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

# Usage

Proxy is designed to run at the port you configured it to run at. You can reach it using the https protocol only. Intended host is parsed using the X-Host, or x-host header. You can specificy the X-Host, or x-host querystring rather the header. The header, or querystring will be parsed out before reaching the intended host. X-Key or x-key is also required and must match one of the keys in the config.
