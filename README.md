# tls12-https-proxy
TLS 1.2 Proxy designed to provide a method for communicating with TLS 1.2 only sites for older languages that lack the ability to do it directly. Such as .NET 1.1, 2.0, and 3.5.

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

# Hosting Certificate

This proxy is not exactly a MiTM attack in that it can't impersonate the certificate on X-Host. Instead it will create a physical TLS client and connect to X-Host on the requests behalf. It will then serve that request back to the original request's response with very limited rewrites of the Host header, and temporarily the Accept, and Accept-Encoding headers to prevent compression (not yet supported).

If you are using linux then 'configure' will give you the option of creating a self-signed certificate to host from. This will only work if you disable checking on the certificate in your code however. Instead it's highly advised to host the proxy on a domain with a valid certificate.

# Security

The proxy does not limit connections by ip address, or filter to localhost. This because in all hosting cases you should have access to the systems firewall, or an external firewall unit. You can filter access to the port you have chosen using one of these methods rather than software doing it which is vulnerable to DDoS attacks.

In the event the proxy is public facing there is at least a basic concept of X-Key which will require that each request contain a matching key in the config file (an array so you can add as many as you need). However be advised this is just a basic security measure. It is not cryptographically secure because this would require a fair amount of code changes to legacy applications (which if there running in a version of a language that can't support TLS they absolutely are) which companies most likely will not authorize.

# Usage

Proxy is designed to run at the port you configured it to run at. You can reach it using the https protocol only. Please read above about hosting certificates and security if you have not already.

The proxy will look for two headers OR querystring values with the names X-Host, and X-Key. These values will be removed before reaching X-Host. The values and there purpose with exmaples is explained below:

# X-Host

This can be either a querystring, or a header in the request. This value should contain the address (without http, or https) including the path. If this is missing requests will be terminated before processing.

Example: example.com/api/some/request

# X-Key

This can be either a querystring, or a header in the request. The value should contain a key that matches one of the values in config.keys which can be modified in config.json which is setup with 'configure' or 'configure.bat'. If this is missing requests will be denied before processing.

Example: F4E9F81F-97EA-4720-A907-1A6E41E236B0

# Example

This is an example request to the proxy using querystring data. The querystring data can also be a header in request which is slightly harder to explain by example.

https://proxy.somecompany.com/?X-Key=F4E9F81F-97EA-4720-A907-1A6E41E236B0&X-Host=example.com/api/some/request

Note: The above address is not real. Additionally if your X-Host requires querystring data it's self, AND your chosing to use querystrings with the proxy you will need to first encode your querystring values with url encoding. It's however advised to use request headers if your X-Host requires querystring data to prevent any odd encoding issues.
